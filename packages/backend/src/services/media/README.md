# Media System Documentation

The Media System provides centralized management of all media assets (images and videos) used in the application, separating media storage from entity data.

## Architecture Overview

### Data Structure

```typescript
{
  "media": {
    "media-id-123": {
      "id": "string",
      "type": "image" | "video",
      "url": "string",
      "createdAt": "ISO timestamp",
      "metadata": {
        "prompt": "generation prompt",
        "model": "FLUX | Veo",
        "width": 1024,
        "height": 1024,
        // Video-specific
        "duration"?: 5.0,
        "fps"?: 30,
        // Flexible for future additions
      },
      "entityRefs": ["char-123", "loc-456"],
      "parentMedia"?: "media-id-parent",
      "relatedMedia"?: {
        "versions": ["media-id-upscaled"],
        "derivatives": ["media-id-depth"],
        "sourceFor": ["media-id-video"],
        "transitionVideos": ["transition-id"]
      },
      // For transition videos only
      "transitionSequence"?: ["media-1", "media-2", "media-3"]
    }
  }
}
```

## API Endpoints

### Get All Media
```
GET /api/media
Query params:
  - type: "image" | "video" (optional)
  - entityId: string (optional)
```

### Get Media by ID
```
GET /api/media/:id
```

### Get Derivatives
```
GET /api/media/:id/derivatives
```

### Get Transitions
```
GET /api/media/:id/transitions
```

### Create Media
```
POST /api/media
Body: {
  type: "image" | "video",
  url: string,
  metadata: {
    prompt: string,
    model: string,
    width?: number,
    height?: number,
    duration?: number,
    fps?: number
  },
  entityRefs?: string[],
  parentMedia?: string,
  relatedMedia?: {...},
  transitionSequence?: string[]
}
```

### Update Media
```
PUT /api/media/:id
Body: Partial<Media>
```

### Add Entity Reference
```
POST /api/media/:id/entity-refs
Body: { entityId: string }
```

### Remove Entity Reference
```
DELETE /api/media/:id/entity-refs/:entityId
```

### Delete Media
```
DELETE /api/media/:id
```

### Cleanup Unreferenced Media
```
POST /api/media/cleanup
```

## Usage Examples

### Creating an Image
```typescript
const newImage = await fetch('/api/media', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'image',
    url: 'https://example.com/image.jpg',
    metadata: {
      prompt: 'A beautiful landscape',
      model: 'FLUX',
      width: 1024,
      height: 1024
    },
    entityRefs: ['char-123']
  })
});
```

### Creating a Derivative (Depth Map)
```typescript
const depthMap = await fetch('/api/media', {
  method: 'POST',
  body: JSON.stringify({
    type: 'image',
    url: 'https://example.com/depth.jpg',
    parentMedia: 'media-id-123',
    metadata: {
      prompt: 'depth map',
      model: 'Depth-Model'
    },
    entityRefs: []
  })
});

// Update parent to reference derivative
await fetch('/api/media/media-id-123', {
  method: 'PUT',
  body: JSON.stringify({
    relatedMedia: {
      derivatives: ['new-depth-map-id']
    }
  })
});
```

### Creating a Transition Video
```typescript
const transitionVideo = await fetch('/api/media', {
  method: 'POST',
  body: JSON.stringify({
    type: 'video',
    url: 'https://example.com/transition.mp4',
    transitionSequence: ['media-1', 'media-2', 'media-3', 'media-4'],
    metadata: {
      prompt: 'smooth transition',
      model: 'Veo',
      duration: 10.0,
      fps: 30
    },
    entityRefs: ['loc-a', 'loc-b', 'loc-c', 'loc-d']
  })
});
```

### Getting All Media for an Entity
```typescript
const entityMedia = await fetch('/api/media?entityId=char-123');
```

## Service Methods

The `MediaService` class provides the following methods:

- `getAllMedia()` - Get all media
- `getMediaById(id)` - Get specific media
- `getMediaByEntityRef(entityId)` - Get media by entity
- `getMediaByType(type)` - Filter by type
- `getDerivatives(parentMediaId)` - Get derivatives
- `getTransitionVideos(mediaId)` - Get transitions
- `createMedia(input)` - Create new media
- `updateMedia(id, updates)` - Update media
- `addEntityRef(mediaId, entityId)` - Add entity ref
- `removeEntityRef(mediaId, entityId)` - Remove entity ref
- `deleteMedia(id)` - Delete media
- `cleanupUnreferencedMedia()` - Delete orphaned media

## Future Enhancements

1. **Entity Schema Updates** - Update characters/worlds to reference media by ID
2. **Migration Script** - Extract existing images to media.json
3. **Frontend Integration** - Update UI to use media API
4. **Real Database** - Migrate from JSON to proper database
5. **Cloud Storage** - Move from temp-db to cloud storage (S3, etc.)
6. **Media Versioning** - Support multiple versions of same media
7. **Batch Operations** - Support bulk create/update/delete
8. **Media Thumbnails** - Generate and store thumbnails

## Storage Location

Currently: `packages/backend/temp-db/media.json`

Future: Database with cloud storage for actual media files
