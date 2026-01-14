# GO_INSIDE2 Test Scenarios

## Validation Criteria
1. No structure inside itself
2. No unexplained openings
3. Solid ceiling for indoor spaces
4. Visual signature as surface treatment
5. Scale appropriate
6. Entrance behind camera

---

## Test Cases (Max Variation)

### 1. Sci-Fi Tower (megastructure, metal, angular)
```
/NEW_WORLD_LOCATION The Chronos Pillar - A towering sci-fi spire of metallic panels and glowing energy conduits, angular geometry piercing the sky
/GO_INSIDE2 Command Nexus
```
- [x] Pass

### 2. Egyptian Pyramid (megastructure, stone, ancient)
```
/NEW_WORLD_LOCATION The Obsidian Pyramid - An Egyptian dark fantasy pyramid of black volcanic glass with gold hieroglyphs, torch-lit at dusk
/GO_INSIDE2 Chamber of Whispers
```
- [x] Pass

### 3. Small Cottage (tiny, cozy, organic)
```
/NEW_WORLD_LOCATION Weathered Fisherman's Cottage - Whitewashed stone walls, weathered blue shutters, thatched roof, coastal cliff setting
/GO_INSIDE2 Main Room
```
- [x] Pass (v1.0: exterior plants leaking → fixed in v1.1)

### 4. Spaceship (vehicle, hull, industrial)
```
/NEW_WORLD_LOCATION Stellar Freighter Vagrant - Battered hull plating, cargo containers mag-locked to exterior, industrial spaceship aesthetic
/GO_INSIDE2 Cargo Hold
```
- [X] Pass

### 5. Natural Cave (formation, underground, crystal)
```
/NEW_WORLD_LOCATION Crystal Cave Mouth - Jagged amethyst crystal formations, purple-blue glow, mineral deposits framing dark entrance
/GO_INSIDE2 Inner Grotto
```
- [x] Pass

### 6. Medieval Tower (historical, stone, vertical)
```
/NEW_WORLD_LOCATION Medieval Castle Tower - Grey stone walls, crenellated battlements, narrow arrow slits, misty highlands
/GO_INSIDE2 Armory
```
- [x] Pass

### 7. Glass Building (modern, transparent, reflective)
```
/NEW_WORLD_LOCATION Glass Office Tower - Floor-to-ceiling glass curtain wall, steel frame, reflective facade, city skyline
/GO_INSIDE2 Server Room
```
- [x] Pass

### 8. Organic Alien (bio-mechanical, curved, living)
```
/NEW_WORLD_LOCATION Alien Dropship - Bio-mechanical hull, chitinous armor plates, pulsing organic veins, landed in clearing
/GO_INSIDE2 Troop Bay
```
- [x] Pass

### 9. Fantasy Skull (bone, whimsical, converted)
```
/NEW_WORLD_LOCATION Dragon's Skull Lair - Massive dragon skull converted to dwelling, bone architecture, ominous volcanic setting
/GO_INSIDE2 Treasure Hoard
```
- [x] Pass

### 10. Hollow Tree (natural, wood, mystical)
```
/NEW_WORLD_LOCATION Ancient Hollow Tree - Massive gnarled trunk, moss-covered bark, mystical aura, forest primeval
/GO_INSIDE2 Root Chamber
/GO_INSIDE2 top terrace in the treetop with view over the forest canopy
```
- [x] Pass

---

## Outdoor→Outdoor Test Cases (v1.4)

### 11. City Park (outdoor area, landscaped)
```
/NEW_WORLD_LOCATION Victoria Park - A gated city park with ornate iron gates, tree-lined paths, Victorian lamp posts, manicured gardens
/GO_INSIDE2 The Central Lawn
```
- [x] Pass

### 12. Festival Grounds (outdoor event, temporary structures)
```
/NEW_WORLD_LOCATION Burning Man - Black Rock Desert playa with massive art installations, dust storms, neon-lit structures at night
/GO_INSIDE2 The Temple of Gratitude
```
- [x] Pass

### 13. Beach Village (outdoor coastal, tropical)
```
/NEW_WORLD_LOCATION Palolem Beach, Goa - Palm trees, colorful beach huts, fishing boats on sand, Indian Ocean backdrop
/GO_INSIDE2 The Beachfront Promenade
```
- [ ] Pass

---

## Test Log

| # | Scenario | Material | Scale | Result |
|---|----------|----------|-------|--------|
| 1 | Chronos Pillar | Metal/tech | Mega | ✅ |
| 2 | Obsidian Pyramid | Stone/glass | Mega | ✅ |
| 3 | Fisherman's Cottage | Stone/wood | Tiny | ⚠️ v1.0 |
| 4 | Stellar Freighter | Metal/industrial | Vehicle | |
| 5 | Crystal Cave | Crystal/mineral | Natural | |
| 6 | Castle Tower | Stone/medieval | Medium | |
| 7 | Glass Tower | Glass/steel | Modern | |
| 8 | Alien Dropship | Bio-organic | Vehicle | |
| 9 | Dragon Skull | Bone | Fantasy | |
| 10 | Hollow Tree | Living wood | Natural | |

## Prompt Refinements

| Version | Change |
|---------|--------|
| v1.0 | Initial prompt with universal indoor rules |
| v1.1 | Added prohibition: "No exterior vegetation, plants, or foliage from outside" |
| v1.2 | Softened: "No exterior vegetation unless interior description specifies overgrowth/abandoned" |
| v1.3 | Force spaceType='exterior' for NEW_WORLD_LOCATION (fixes caves generating interior) |
| v1.4 | Added parallel buildEnterOutdoorEditPrompt() for outdoor→outdoor navigation |
| v1.5 | Strengthened outdoor entrance prohibition: "must NOT be visible anywhere in frame" |
| v1.6 | Added buildEnterSemiEnclosedEditPrompt() + improved spaceType detection criteria in goInside.ts |
