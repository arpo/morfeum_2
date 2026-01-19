

# Morfeum Memory System

Instruction doc for coding AI (mzoo stack)

## Goal

Build a **persistent, correctable, entity-centric memory system** for Morfeum that supports:

* **Long-horizon continuity** (restart-safe)
* **Authority + provenance** (no “vector truth”)
* **Editing / supersession** (fix wrong memories without deletion)
* **Entity memory** (characters, locations, worlds, relationships)
* **Retrieval that respects time + confidence + authority**
* **Maintenance** (decay, consolidation, re-embedding)

Memory must influence **chat + world generation + navigation constraints**, not just “remember user preferences”.

---

## Core Principles (Non-negotiable)

1. **Embeddings are for discovery, not truth.**
   Retrieval returns candidates; **authority filters decide what can be believed**.

2. **Append-only event log + versioned facts.**
   We never truly “delete history”. We supersede and audit.

3. **Memory is entity-centric.**
   Everything is anchored to an `owner_entity_id` (character/location/world/relationship/user).

4. **Explicit provenance.**
   Any derived memory references sources (interaction IDs, message IDs, tool outputs, URLs, etc).

5. **Restart continuity.**
   On boot, each active entity loads a small “profile pack” + recent state.

---

## Architecture Overview

### Layers

* **Session / Working Memory (volatile)**
  In-memory per thread: current goals, ephemeral notes, scratchpads.

* **Authority Memory (canonical, versioned)**
  Postgres tables: claims, facts, entity profile rows, relationship states.
  This is what the system trusts.

* **Archival Memory (immutable)**
  Raw event logs, tool responses, large payloads in blob storage; Postgres stores pointers.

* **Index Layer (embeddings)**
  pgvector row(s) for each memory unit and model version. Rebuildable.

* **Maintenance Jobs**
  Consolidation, decay/pruning, re-embedding, conflict detection.

---

## Data Model

### Entity Types

Morfeum “memory owner” (`owner_entity_type`) must support:

* `user` (optional but useful)
* `character` (NPCs, Aluna)
* `location`
* `world`
* `relationship` (pairwise or group entity: `rel:user<->aluna`, `rel:aluna<->lighthouse`)
* `system` (global rules / canon)

### Memory Units

We store two major kinds of memory:

1. **Events** (immutable, time-stamped): “user said X”, “generated location Y”, “Aluna promised Z”
2. **Claims/Facts** (mutable via supersession): “User prefers Python”, “This tower collapsed”, “Aluna trusts Mattias = 0.7”

Events are the source-of-truth history. Claims are the **current** truth snapshot.

---

## Postgres Schema (Drizzle)

### 1) `memory_events` (append-only)

Stores raw “what happened” with pointers to full payloads.

Fields:

* `id` (ulid/uuid)
* `owner_entity_id`, `owner_entity_type`
* `thread_id` (optional)
* `event_type` (enum string): `user_message`, `agent_message`, `tool_result`, `world_gen`, `nav_move`, `memory_write`, `memory_correction`, etc
* `summary` (short text)
* `payload_ref` (blob key / URL) — store large raw payloads here, not in DB
* `created_at`
* `source` (enum): `user | agent | tool | external_api | corrected_by_human`
* `provenance` (jsonb: ids/urls)
* `hash` (optional for dedupe)

Indexes:

* `(owner_entity_id, created_at desc)`
* `(thread_id, created_at desc)`
* `event_type`

### 2) `memory_claims` (canonical truth, versioned)

One row per “claim version”. Current truth = row where `superseded_by is null`.

Fields:

* `id`
* `owner_entity_id`, `owner_entity_type`
* `scope` (enum): `identity | preference | relationship | world_state | location_state | lore | rule | task | skill`
* `claim_key` (string) — stable key for conflict resolution (e.g. `user.pref.language`, `location.tower.state`)
* `content` (text) — human-readable claim
* `data` (jsonb) — structured version of the claim (optional but recommended)
* `confidence` (0..1)
* `authority` (0..1) — based on source (human > tool > agent)
* `source` (enum)
* `provenance` (jsonb array)
* `created_at`
* `version` (int)
* `superseded_by` (nullable id)
* `valid_from` (optional)
* `valid_to` (optional)
* `tags` (jsonb)

Indexes:

* `(owner_entity_id, claim_key, superseded_by)`
* `(owner_entity_id, scope, superseded_by)`
* GIN on `tags`, `data` if needed

### 3) `memory_embeddings` (separate, rebuildable)

Do **not** lock embedding shape into claims table long-term.

Fields:

* `id`
* `memory_type` (`claim|event`)
* `memory_id`
* `model` (e.g. `text-embedding-3-large`)
* `dimensions`
* `embedding` (pgvector)
* `created_at`

Indexes:

* `ivfflat` / `hnsw` (depending on your pgvector setup)
* `(memory_type, memory_id, model)` unique

### 4) `entity_profiles` (fast boot pack)

This is a convenience cache for “who am I” loading. It’s derived from claims.

Fields:

* `owner_entity_id`, `owner_entity_type` (pk)
* `profile_md` (text) — short stable profile
* `profile_json` (jsonb) — structured summary for prompts
* `updated_at`
* `profile_version` (int)
* `source_claim_ids` (jsonb) — which claims were used

This lets you load identity in one query.

---

## Memory Write Pipeline (must implement)

### Input

* new user message / tool result / agent reflection / world event

### Steps

1. **Ingest Event**
   Always create a `memory_events` row. Store full raw payload in blob, keep pointer.

2. **Extract Candidate Claims (LLM)**
   Run a “Memory Extractor” prompt that outputs JSON array:

   * `scope`
   * `claim_key`
   * `content`
   * `data`
   * `confidence`
   * `tags`
   * `provenance` (include event id)
   * `owner_entity_id/type` (derived from context)

3. **Validate + Gate**
   Apply rules before writing claims:

   * reject low-signal fluff
   * forbid writing “guesses” as facts unless marked as `hypothesis`
   * ensure claim_key exists
   * enforce structured types for known scopes (zod)

4. **Conflict Check**
   For each candidate claim:

   * fetch current active claim with same `(owner_entity_id, claim_key)`
   * if none: insert as version=1
   * if exists:

     * if compatible: optionally merge / bump confidence
     * if contradictory: create **new version** and set old `superseded_by=new_id`

5. **Write Claims**
   Insert `memory_claims` rows.

6. **Embed**
   For each written claim (and optionally event summaries):

   * create embedding record in `memory_embeddings`
   * store model name + dimensions
   * embeddings are allowed to be regenerated later

7. **Update Entity Profile Pack**
   For the affected owner entity:

   * select top authoritative, active claims for identity/preferences/relationship
   * generate `profile_md` + `profile_json`
   * write to `entity_profiles`

---

## Retrieval Pipeline (must implement)

### API

`getMemoryContext({ owner_entity_id, owner_entity_type, query, thread_id?, limit? })`

### Steps

1. **Embed query**
2. **Candidate search**
   Search `memory_embeddings` → join to `memory_claims` (active only)
3. **Authority filter**
   Only include claims where:

   * `superseded_by is null`
   * `authority * confidence >= threshold`
4. **Temporal weighting**
   Combine:

   * vector similarity
   * recency decay
   * authority-weight
5. **Assemble context pack**
   Return:

* `profile_pack` from `entity_profiles` (always)
* top N relevant claims (short)
* optional: supporting event IDs for provenance

### Output format (for prompt injection)

Return something compact and stable:

* `ENTITY_PROFILE:` (md or json)
* `CANONICAL_CLAIMS:` bullet list with ids + timestamps
* `RECENT_EVENTS:` optional short list

---

## Maintenance Jobs (cron / queue)

### Nightly: Consolidation

* detect duplicates (same claim_key, same content)
* merge into one claim (supersede duplicates)
* bump confidence based on frequency / repeated confirmations

### Weekly: Profile refresh

* regenerate `entity_profiles` for active entities
* compress long lists into stable summaries

### Monthly: Re-embedding

* re-embed claims with latest embedding model
* keep older embeddings for rollback, or delete by policy

### Decay policy

* claims don’t “decay” into falsehood, but they can become **inactive** if:

  * explicitly time-bounded (`valid_to`)
  * superseded
  * marked `stale` by policy

Events never decay; they archive.

---

## What “Memory” Means in Morfeum (domain rules)

### Character memory

* preferences about the user
* relationship state (trust, attraction, fear, respect)
* promises made (and whether kept)
* discovered secrets

### Location memory

* persistent objects (if a door was opened, that is state)
* damage/collapse/burning
* discovered notes / inscriptions
* “visual anchors” must remain stable (ties into your navigation constraints)

### World memory

* canon rules (physics, lore)
* global timeline events
* factions and their status

### Relationship memory (recommended)

Represent relationships as their own entity:

* owner_entity_type = `relationship`
* `relationship.members = [A,B]`
* claims like `relationship.trust = 0.7`, `relationship.last_conflict_event_id`

This avoids scattering relationship truth across two entities.

---

## mzoo Integration Requirements

### Services to implement (TypeScript)

Create a package/module: `mzoo-memory`

* `MemoryEventStore`

  * `appendEvent()`
  * `listEvents()`

* `MemoryClaimStore`

  * `upsertClaimVersioned()` (conflict/supersession logic)
  * `getActiveClaimByKey()`
  * `listActiveClaimsByScope()`

* `MemoryEmbeddingStore`

  * `embedClaim()`
  * `semanticSearchClaims()`

* `MemoryProfileService`

  * `buildEntityProfilePack()`
  * `getEntityProfilePack()`

* `MemoryWriteOrchestrator`

  * `ingestAndUpdateMemory({event, context})`

* `MemoryRetrievalService`

  * `getMemoryContext({owner, query})`

### Storage

* Postgres (Cloud SQL) + pgvector
* Blob storage via mzoo (R2/GCS) for payloads

### Queue / cron

Use your existing mzoo job runner pattern (or Cloud Tasks / BullMQ / whatever you’re already using).

---

## Folder Structure (suggested)

```
packages/mzoo-memory/
  src/
    db/
      schema.ts
      migrations/
    services/
      eventStore.ts
      claimStore.ts
      embeddingStore.ts
      profileService.ts
      writeOrchestrator.ts
      retrievalService.ts
    rules/
      validators.ts        // zod schemas per scope
      authority.ts         // source -> authorityWeight
      conflict.ts          // contradiction detection per claim_key
    prompts/
      memoryExtractor.ts   // produces JSON claims
      profileBuilder.ts
    api/
      routes.ts            // if exposing HTTP
    tests/
      memory.spec.ts
```

---

## Conflict Resolution (must be deterministic)

Define per `claim_key` how conflicts are resolved. Examples:

* `user.pref.language`

  * new value replaces old (supersede)
* `location.tower.state`

  * state machine:

    * `standing -> damaged -> collapsed`
    * forbid impossible reversal unless explicitly “repaired” event
* `relationship.trust`

  * numeric update with bounded delta; keep history as events, current as claim

Store these rules in code first (fast), optionally later in DB.

---

## Minimum Viable Milestone (MVP)

Deliver this first:

1. Tables: `memory_events`, `memory_claims`, `memory_embeddings`, `entity_profiles`
2. Write pipeline:

   * event append
   * claim extraction (LLM JSON)
   * conflict & supersession
   * embeddings
   * profile pack update
3. Retrieval endpoint:

   * returns profile pack + relevant claims
4. One nightly consolidation job (optional in MVP)

This is enough to make characters/worlds **restart-safe** and non-garbage over time.

---

## Definition of Done (acceptance tests)

### Test A — Preferences supersession

* User says “I prefer Python”
* Later says “Actually, Rust now”
* Retrieval returns Rust as active claim; Python is superseded and still auditable.

### Test B — Location state permanence

* A tower collapses event triggers claim `location.tower.state=collapsed`
* Later scene generation must not show standing tower unless repair event exists.

### Test C — Provenance

* Every claim can list the `event_id`(s) it came from
* Debug UI can show “why the system believes this”

### Test D — Restart

* Kill server, restart
* Entity profile loads from `entity_profiles`
* Agent continues with same identity and relationship state

---

## Notes for Morfeum specifically

* Treat **DNA** as “visual canon”. Memory claims about a location must be compatible with DNA anchors. If memory implies a layout change, it must be written as explicit **state claims** and then fed into generation prompts.
* Do not let the agent write claims about copyrighted real-world IP unless your existing “fictional/copyright flags” permit it.
