# MZOO API Specification: Gemini with Explicit Caching & Thinking Mode

This document specifies the API changes needed in MZOO to support Gemini with Explicit Caching and Thinking Mode for Morfeum.

---

## Overview

Morfeum wants to leverage two key Gemini features:

1. **Explicit Caching** - Cache large static prompts to reduce costs by ~90%
2. **Thinking Mode** - Enable model reasoning for complex tasks

---

## 1. Explicit Caching

### How It Works

1. **Create Cache**: Upload static content (system instructions, rules, examples) once
2. **Reference Cache**: Subsequent requests reference the cache by name
3. **Cost Savings**: Cached tokens cost 90% less than non-cached tokens
4. **Minimum Requirement**: Cache must contain ≥2,048 tokens

### SDK Implementation (GoogleGenAI)

```typescript
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelName = "gemini-2.5-flash-lite";

// STEP 1: Create the cache
const cache = await genAI.caches.create({
  model: modelName,
  config: {
    displayName: "morfeum-world-creation",
    systemInstruction: "You are a world-building AI architect.",
    contents: [
      {
        role: "user",
        parts: [{ text: LARGE_STATIC_PROMPT_CONTENT }]  // ≥2,048 tokens
      }
    ],
    ttl: "3600s"  // Cache expires in 1 hour
  }
});

console.log(`Cache created: ${cache.name}`);
// Returns: "cachedContents/abc123xyz..."

// STEP 2: Use the cache in requests
const result = await genAI.models.generateContent({
  model: modelName,
  contents: [
    { role: "user", parts: [{ text: dynamicUserPrompt }] }
  ],
  config: {
    cachedContent: cache.name  // Reference the cache
  }
});
```

### Required MZOO Endpoints

#### 1.1 Create Cache

```
POST /api/v1/ai/gemini/cache
```

**Request:**
```json
{
  "displayName": "morfeum-world-creation",
  "model": "gemini-2.5-flash-lite",
  "systemInstruction": "Optional system instruction",
  "staticContent": "Large static prompt content (≥2,048 tokens)",
  "ttl": "3600s"
}
```

**Response:**
```json
{
  "success": true,
  "cacheId": "cachedContents/abc123xyz...",
  "displayName": "morfeum-world-creation",
  "tokenCount": 4500,
  "expiresAt": "2025-12-31T05:48:00Z"
}
```

#### 1.2 Generate with Cache

```
POST /api/v1/ai/gemini/cached-text
```

**Request:**
```json
{
  "cacheId": "cachedContents/abc123xyz...",
  "prompt": "Dynamic user prompt here",
  "model": "gemini-2.5-flash-lite",
  "thinkingConfig": {
    "includeThoughts": true,
    "thinkingBudget": 2048
  }
}
```

**Response:**
```json
{
  "success": true,
  "text": "Generated response...",
  "thoughts": "Model reasoning (if includeThoughts=true)...",
  "usage": {
    "promptTokens": 150,
    "cachedTokens": 4500,
    "completionTokens": 500,
    "thinkingTokens": 200
  },
  "cacheHit": true
}
```

#### 1.3 List Caches

```
GET /api/v1/ai/gemini/caches
```

**Response:**
```json
{
  "success": true,
  "caches": [
    {
      "cacheId": "cachedContents/abc123xyz...",
      "displayName": "morfeum-world-creation",
      "tokenCount": 4500,
      "expiresAt": "2025-12-31T05:48:00Z",
      "model": "gemini-2.5-flash-lite"
    }
  ]
}
```

#### 1.4 Delete Cache

```
DELETE /api/v1/ai/gemini/cache/{cacheId}
```

**Response:**
```json
{
  "success": true,
  "deleted": "cachedContents/abc123xyz..."
}
```

#### 1.5 Refresh Cache TTL

```
PATCH /api/v1/ai/gemini/cache/{cacheId}
```

**Request:**
```json
{
  "ttl": "7200s"
}
```

---

## 2. Thinking Mode

### How It Works

Thinking Mode enables the model to show its reasoning process. This is useful for:
- Complex multi-step tasks
- Debugging unexpected outputs
- Understanding model decisions

### Configuration

```typescript
const result = await genAI.models.generateContent({
  model: "gemini-2.5-flash-lite",
  contents: [{ role: "user", parts: [{ text: prompt }] }],
  config: {
    thinkingConfig: {
      includeThoughts: true,   // Return reasoning in response
      thinkingBudget: 2048     // Max tokens for reasoning (512-24576)
    }
  }
});
```

### Response Structure

When `includeThoughts: true`, response parts have a `thought` flag:

```typescript
const candidate = result.candidates[0];
for (const part of candidate.content.parts) {
  if (part.thought) {
    console.log("REASONING:", part.text);
  } else {
    console.log("ANSWER:", part.text);
  }
}
```

### ThinkingConfig Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `includeThoughts` | boolean | false | Return reasoning steps in response |
| `thinkingBudget` | number | 0 (off) | Token limit for reasoning (512-24,576) |

**Notes:**
- For Flash-Lite, thinking is OFF by default (set `thinkingBudget ≥ 512` to enable)
- Setting `thinkingBudget: 0` disables thinking
- Higher budgets allow more complex reasoning but cost more tokens

---

## 3. Morfeum Cache Groups

Morfeum will create these cache groups:

### Cache Group 1: "morfeum-world-creation" (~4,500 tokens)
- Hierarchy categorization rules
- DNA schema definitions
- Element rules (dominant/navigable)
- Composition instructions

### Cache Group 2: "morfeum-character" (~3,800 tokens)
- Character deep profile template
- Character seed rules
- Vision description prompt

### Cache Group 3: "morfeum-navigation" (~2,800 tokens)
- Structure analysis rules
- Intent classifier rules
- Destination analysis template
- Space type registry descriptions

---

## 4. TypeScript Types for MZOO Client

```typescript
// Cache Management Types
interface CreateCacheRequest {
  displayName: string;
  model: string;
  systemInstruction?: string;
  staticContent: string;
  ttl?: string;  // Default: "3600s"
}

interface CreateCacheResponse {
  success: boolean;
  cacheId: string;
  displayName: string;
  tokenCount: number;
  expiresAt: string;
}

// Cached Generation Types
interface CachedGenerationRequest {
  cacheId: string;
  prompt: string;
  model?: string;
  thinkingConfig?: {
    includeThoughts?: boolean;
    thinkingBudget?: number;
  };
}

interface CachedGenerationResponse {
  success: boolean;
  text: string;
  thoughts?: string;
  usage: {
    promptTokens: number;
    cachedTokens: number;
    completionTokens: number;
    thinkingTokens?: number;
  };
  cacheHit: boolean;
}

// List/Delete Types
interface CacheInfo {
  cacheId: string;
  displayName: string;
  tokenCount: number;
  expiresAt: string;
  model: string;
}

interface ListCachesResponse {
  success: boolean;
  caches: CacheInfo[];
}
```

---

## 5. Error Handling

### Cache-Specific Errors

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `CACHE_NOT_FOUND` | Cache ID doesn't exist or expired | Create new cache |
| `CACHE_EXPIRED` | Cache TTL exceeded | Create new cache |
| `CACHE_TOO_SMALL` | Content < 2,048 tokens | Add more static content |
| `CACHE_QUOTA_EXCEEDED` | Too many active caches | Delete unused caches |

### Recommended Error Response

```json
{
  "success": false,
  "error": {
    "code": "CACHE_NOT_FOUND",
    "message": "Cache 'cachedContents/abc123' not found or expired",
    "suggestion": "Create a new cache with the static content"
  }
}
```

---

## 6. Implementation Notes

### Cache Lifecycle Management

1. **On First Request**: Check if cache exists with matching displayName
2. **If Not Found**: Create new cache, store cacheId
3. **On Generation**: Use cacheId in request
4. **Before Expiry**: Optionally refresh TTL
5. **On Prompt Update**: Delete old cache, create new one

### Recommended Cache TTL

| Use Case | TTL | Reason |
|----------|-----|--------|
| Production (stable prompts) | 24h | Prompts rarely change |
| Development | 1h | Frequent iteration |
| High-traffic | 4h | Balance cost/freshness |

### Cost Calculation

```
Standard tokens: $X per million
Cached tokens:   $X * 0.1 per million (90% discount)
Thinking tokens: $X per million (same as standard)
```

---

## 7. Full SDK Example

```typescript
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function createAndUseCache() {
  // 1. Create cache with large static content
  const cache = await genAI.caches.create({
    model: "gemini-2.5-flash-lite",
    config: {
      displayName: "morfeum-world-creation",
      systemInstruction: "You are a world-building AI architect for Morfeum.",
      contents: [{
        role: "user",
        parts: [{ text: `
          [HIERARCHY RULES]
          Spatial hierarchy analyzer. Organize input into: Host → Region → Location → Niche.
          
          [DNA SCHEMA]
          looks: 2-4 sentences describing forms, layout, scale, features
          colorsAndLighting: 1-3 sentences about colors, light sources, shadows
          atmosphere: 2-4 sentences about air, temperature, motion, weather
          materials: 1-3 sentences about materials, textures, condition
          mood: 1-2 sentences about emotional tone
          
          [EXAMPLES]
          Input: "A cozy bar in Camden"
          Output: { "host": {"name": "London"}, "region": {"name": "Camden"}, "location": {"name": "The Rustic Anchor"} }
          
          [...more static content to reach 2,048+ tokens...]
        ` }]
      }],
      ttl: "3600s"
    }
  });

  console.log(`Cache created: ${cache.name}`);

  // 2. Generate content using the cache + thinking
  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: [{
      role: "user",
      parts: [{ text: "Create a hierarchy for: A steampunk factory in Victorian London" }]
    }],
    config: {
      cachedContent: cache.name,
      thinkingConfig: {
        includeThoughts: true,
        thinkingBudget: 2048
      }
    }
  });

  // 3. Parse response
  const candidate = result.candidates[0];
  for (const part of candidate.content.parts) {
    if (part.thought) {
      console.log("\n--- MODEL REASONING ---");
      console.log(part.text);
    } else {
      console.log("\n--- FINAL ANSWER ---");
      console.log(part.text);
    }
  }

  // 4. Cleanup (optional)
  // await genAI.caches.delete({ name: cache.name });
}

createAndUseCache();
```

---

## Contact

For questions about this specification, contact the Morfeum team.
