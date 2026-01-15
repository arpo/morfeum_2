# LOOK Command Best Practices Guide

The `/LOOK` command creates **view nodes** - camera movements within the same space that let you explore different angles and perspectives without leaving the location.

## Quick Reference

| Intent | Best Phrasing | Result |
|--------|---------------|--------|
| Look through window | `/LOOK out the window` | Close-up, looking outward through glass |
| Look at specific window | `/LOOK out the right window` | Faces and looks through specified window |
| See panorama/vista | `/LOOK see the view from the balcony` | Distant panorama, minimal foreground |
| Inspect detail | `/LOOK closer at the painting` | Tight framing on target |
| Change angle | `/LOOK up at the ceiling` | Dramatic camera tilt |
| Move through space | `/LOOK walk toward the fireplace` | Camera moves, approaches target |
| Widen view | `/LOOK step back to see more` | Wider shot, more context |

---

## Command Patterns

### 1. Looking Through Windows/Openings

**Best for:** Seeing what's outside through a window, door, or opening

**✅ Recommended phrasings:**
```
/LOOK out the window
/LOOK out the right window
/LOOK out the window at the garden
/LOOK through the doorway
```

**❌ Avoid:**
```
/LOOK out through the window to the right  (too complex, may just tilt)
/LOOK at the window  (focuses on window itself, not view beyond)
```

**What happens:** Camera moves close to the glass and looks OUTWARD. The exterior view fills most of the frame.

---

### 2. Viewing Panoramas from Vantage Points

**Best for:** Balconies, terraces, overlooks - when you want to see the distant view

**✅ Recommended phrasings:**
```
/LOOK see the view from the balcony
/LOOK at the panorama
/LOOK see the view of surrounding
/LOOK at the distant cityscape
```

**❌ Avoid:**
```
/LOOK at the balcony railing  (focuses on railing, not view)
/LOOK see the view from the balcony railing  (includes railing in frame)
```

**What happens:** Camera positions at the edge, looks outward. Foreground elements (railings, furniture) are minimized. Distant vista dominates 80%+ of frame.

---

### 3. Inspecting Details

**Best for:** Paintings, objects, textures, signage

**✅ Recommended phrasings:**
```
/LOOK closer at the painting
/LOOK inspect the bookshelf
/LOOK at the details on the table
/LOOK read the sign
```

**What happens:** Camera moves close, tight framing with 85mm lens feel. Subject fills most of frame.

---

### 4. Changing Camera Angle

**Best for:** Looking up, down, turning to face something

**✅ Recommended phrasings:**
```
/LOOK up at the ceiling
/LOOK down at the floor
/LOOK turn to the left
/LOOK face the door
```

**What happens:** Dramatic camera rotation/tilt. Subject fills 60-80% of frame.

---

### 5. Moving Through Space

**Best for:** Walking toward something, approaching an area

**✅ Recommended phrasings:**
```
/LOOK walk toward the fireplace
/LOOK approach the table
/LOOK step closer to the window
/LOOK move to the other side
```

**What happens:** Camera physically moves through space while keeping target in view.

---

### 6. Widening the View

**Best for:** Seeing more of the room, stepping back

**✅ Recommended phrasings:**
```
/LOOK step back to see more
/LOOK wider view
/LOOK show the whole room
/LOOK zoom out
```

**What happens:** Camera steps backward, ultra-wide 24mm lens feel, shows spatial relationships.

---

## Phrasing Tips

### ✅ Do:

1. **Use simple noun modifiers**
   - ✅ `the right window` (adjective + noun)
   - ❌ `the window to the right` (prepositional phrase)

2. **Keep targets direct**
   - ✅ `the painting` 
   - ❌ `the old painting that hangs on the wall above the fireplace`

3. **For panoramas, focus on "the view"**
   - ✅ `see the view from the terrace`
   - ❌ `look at the terrace railing`

4. **For windows, say "out the window"**
   - ✅ `out the window`
   - ❌ `at the window` (shows window, not view)

### ❌ Don't:

1. **Don't chain multiple prepositions**
   - ❌ `out through the window to the right`

2. **Don't include the vantage point in the target when you want the vista**
   - ❌ `see the balcony railing and the view` (keeps railing prominent)

3. **Don't use overly complex descriptions**
   - ❌ `look at what might be visible through the ornate grilled window opening on the eastern wall`

---

## Troubleshooting

### Problem: "Only tilts slightly, doesn't really change"
**Solution:** Use more direct phrasing. Instead of `look toward the X`, try `turn to face the X` or `look up/down at the X`.

### Problem: "Shows too much room when looking out window"
**Solution:** Use `out the window` phrasing. This triggers the zoom_in operation with tight framing.

### Problem: "Shows the railing/balcony instead of the view"
**Solution:** Use `see the view from` phrasing. Focus on what's BEYOND, not the vantage point.

### Problem: "Invents new elements that weren't in the scene"
**Solution:** This is rare but can happen. The command includes explicit instructions not to invent elements. Try rephrasing with more specific existing targets.

---

## View Node Behavior

When you use `/LOOK`, the system creates a **view node** under the current location:

```
📍 Grand Vestibule
   └── 👁 Through the Window
   └── 👁 The Ceiling Above
   └── 👁 The Panorama
```

- View nodes appear in italics with an eye icon
- They represent camera angles, not new locations
- You can click on them to return to that view
- They don't create new hierarchy levels

---

## Technical Notes

The LOOK command uses a two-step process:

1. **LLM Analysis:** Parses your instruction and determines:
   - Operation type (angle_change, traversal, zoom_in, zoom_out)
   - Camera movement description
   - Target noun
   - Lens settings (focal length, aperture, shot distance)

2. **Image Edit:** Sends the camera instruction to FLUX.2 edit model to reframe the current image while preserving scene identity.

The command explicitly prohibits:
- Inventing new architectural elements
- Adding objects that don't exist
- Changing the place identity
- Major structural changes
