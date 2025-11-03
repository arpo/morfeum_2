# 🧭 Navigation System - Complete Test Scenarios

Here's a comprehensive list of test phrases organized by intent type. Each intent includes examples across different genres to demonstrate the genre-agnostic design.

## 1. GO_INSIDE
**Intent**: Enter an enclosed space

**Test Phrases:**
- "go inside"
- "enter"
- "step into the building"
- "go in"
- "enter the cave"
- "step through the doorway"
- "go under the bridge"

**Genre Examples:**
- Fantasy: "enter the castle", "step into the dragon's lair"
- Sci-Fi: "enter the spacecraft", "go inside the airlock"
- Modern: "go into the coffee shop", "enter the museum"
- Underwater: "enter the submarine", "go inside the research station"

---

## 2. GO_OUTSIDE
**Intent**: Exit to an exterior space

**Test Phrases:**
- "go outside"
- "go out"
- "leave"
- "exit"
- "step out"
- "go out the door"

**Genre Examples:**
- Fantasy: "leave the tavern", "exit the dungeon"
- Sci-Fi: "exit the shuttle", "go outside the station"
- Modern: "leave the building", "step outside"

---

## 3. GO_TO_ROOM
**Intent**: Navigate to specific space within current structure

**Test Phrases:**
- "go to the kitchen"
- "take me to the bathroom"
- "bedroom please"
- "go to the rooftop"
- "take me to the basement"
- "head to the lobby"

**Genre Examples:**
- Fantasy: "go to the throne room", "take me to the armory"
- Sci-Fi: "go to engineering", "take me to the bridge", "head to the cargo bay"
- Modern: "go to the conference room", "take me to the garage"

---

## 4. GO_TO_PLACE
**Intent**: Navigate to a distinct location/structure

**Test Phrases:**
- "go to the bridge"
- "take me to the harbor"
- "head to the marketplace"
- "go to the tower"
- "take me to the plaza"

**Genre Examples:**
- Fantasy: "go to the wizard's tower", "take me to the cathedral"
- Sci-Fi: "go to the landing pad", "take me to sector 7"
- Modern: "go to the park", "take me to city hall"
- Underwater: "go to the coral reef", "take me to the trench"

---

## 5. LOOK_AT
**Intent**: Examine something specific more closely

**Test Phrases:**
- "look at the painting"
- "examine the statue"
- "inspect the machine"
- "observe the monument"
- "study the artifact"
- "check out the mural"

**Genre Examples:**
- Fantasy: "look at the ancient scroll", "examine the magic crystal"
- Sci-Fi: "inspect the control panel", "examine the hologram"
- Modern: "look at the sculpture", "examine the exhibit"

---

## 6. LOOK_THROUGH
**Intent**: Look through an opening or transparent surface

**Test Phrases:**
- "look out the window"
- "look in the window"
- "peer through the doorway"
- "gaze through the opening"
- "look through the crack"

**Genre Examples:**
- Fantasy: "look through the arrow slit", "peer through the portcullis"
- Sci-Fi: "look out the viewport", "gaze through the observation window"
- Underwater: "look through the porthole", "peer through the bubble"

---

## 7. CHANGE_VIEW
**Intent**: Change viewing direction or perspective

**Test Phrases:**
- "turn around"
- "look behind me"
- "look up"
- "look down"
- "look left"
- "look right"
- "face north"
- "glance south"

**All Genres:**
- "turn around"
- "look up at the ceiling/sky/roof"
- "look down at the floor/ground"
- "look behind"

---

## 8. GO_UP_DOWN
**Intent**: Change elevation

**Test Phrases:**
- "go up the stairs"
- "go down"
- "climb the ladder"
- "descend"
- "ascend the ramp"
- "go up to the roof"
- "climb to the top"

**Genre Examples:**
- Fantasy: "climb the tower stairs", "descend into the crypt"
- Sci-Fi: "take the elevator up", "descend the maintenance shaft"
- Modern: "go up the escalator", "climb to the second floor"

---

## 9. ENTER_PORTAL
**Intent**: Use a special passage or transition point

**Test Phrases:**
- "enter the portal"
- "step through the gateway"
- "step into the painting"
- "use the teleporter"
- "enter the mirror"
- "go through the archway"

**Genre Examples:**
- Fantasy: "step through the magical portal", "enter the enchanted painting"
- Sci-Fi: "use the warp gate", "enter the dimensional portal"
- Modern: "step through the revolving door"

---

## 10. APPROACH
**Intent**: Move closer to something

**Test Phrases:**
- "go closer"
- "approach the statue"
- "move toward the fountain"
- "get near the machine"
- "step forward"
- "advance toward the door"

**Genre Examples:**
- Fantasy: "approach the altar", "move closer to the throne"
- Sci-Fi: "approach the console", "get near the reactor"
- Modern: "move closer to the stage", "approach the counter"

---

## 11. EXPLORE_FEATURE ⭐ NEW
**Intent**: Follow or continue along a linear feature

**Test Phrases:**
- "follow the river"
- "go further down the corridor"
- "continue along the path"
- "move ahead"
- "keep going"
- "walk along the street"
- "follow the trail"

**Genre Examples:**
- Fantasy: "follow the mountain path", "continue down the forest trail"
- Sci-Fi: "follow the corridor", "continue down the maintenance tunnel"
- Modern: "follow the river", "walk along the street"
- Underwater: "follow the current", "continue along the reef"

---

## 12. RELOCATE ⭐ NEW
**Intent**: Travel to different area/district/region

### Macro (Different District/Region):
**Test Phrases:**
- "take me to a bar in the financial district"
- "go to a cafe in Soho"
- "different pub in Camden Town"
- "bar in the entertainment district instead"

**Genre Examples:**
- Fantasy: "take me to an inn in the capital city", "go to a blacksmith in the merchant quarter"
- Sci-Fi: "go to a lab in the science district", "take me to a bar in sector 9"
- Modern: "go to a restaurant in downtown", "take me to a shop in the mall"

### Micro (Same Area, Nearby):
**Test Phrases:**
- "go to the shop next door"
- "take me to the cafe across the street"
- "bar next door"
- "go to the store nearby"

**Genre Examples:**
- Fantasy: "go to the armorer next door", "take me to the healer's shop nearby"
- Sci-Fi: "go to the hangar next to this one", "take me to the adjacent module"
- Modern: "go to the store next door", "take me to the restaurant across the street"

---

## 13. UNKNOWN
**Intent**: Unclear or non-spatial commands

**Test Phrases:**
- "what time is it"
- "how are you"
- "tell me a story"
- "what can you do"
- (any non-navigation command)

---

## 🎯 Quick Test Sequence

Try this sequence to test all major intents:

1. "go inside" → GO_INSIDE
2. "look at the painting" → LOOK_AT
3. "go to the kitchen" → GO_TO_ROOM
4. "look out the window" → LOOK_THROUGH
5. "turn around" → CHANGE_VIEW
6. "go up the stairs" → GO_UP_DOWN
7. "follow the corridor" → EXPLORE_FEATURE
8. "go outside" → GO_OUTSIDE
9. "take me to a bar in the financial district" → RELOCATE (macro)
10. "shop next door" → RELOCATE (micro)

Each command should display detailed intent classification and routing decision in the browser console!