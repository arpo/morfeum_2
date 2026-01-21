/**
 * World V2 Routes
 *
 * Simplified world creation system with command chaining support.
 */

import { Router } from 'express';
import {
  newHostHandler,
  newRegionHandler,
  newLocationHandler,
  newWorldLocationHandler,
  newWorldLocationInteriorHandler,
  goInsideHandler,
  gotoHandler,
  lookHandler,
  eventsHandler,
  setTimeHandler,
  setWeatherHandler,
  navigationAssistantHandler,
  editImageHandler,
  redrawHandler,
  generateVideoLoopHandler
} from './handlers';
import { displayHandler } from './display';

const router = Router();

// SSE Events Endpoint
router.get('/events/:operationId', eventsHandler);

// NEW_HOST Command
router.post('/new-host', newHostHandler);

// NEW_REGION2 Command
router.post('/new-region', newRegionHandler);

// NEW_LOCATION2 Command
router.post('/new-location', newLocationHandler);

// DISPLAY Command
router.post('/display', displayHandler);

// NEW_WORLD_LOCATION Command - Create complete world hierarchy (Host + Region + Location) with image
router.post('/new-world-location', newWorldLocationHandler);

// NEW_WORLD_LOCATION_INTERIOR Command - Create interior location as child of existing location
router.post('/new-world-location-interior', newWorldLocationInteriorHandler);

// SET_TIME Command - Update host timeOfDay
router.post('/set-time', setTimeHandler);

// SET_WEATHER Command - Update host weather
router.post('/set-weather', setWeatherHandler);

// GO_INSIDE Command - Navigate into a space using image edit
router.post('/go-inside', goInsideHandler);

// GOTO Command - Create sibling space within same container
router.post('/goto', gotoHandler);

// LOOK Command - Change viewpoint within same space (creates view node)
router.post('/look', lookHandler);

// Navigation Assistant Chat - AI help for navigation commands
router.post('/navigation-assistant/chat', navigationAssistantHandler);

// EDIT_IMAGE Command - Edit existing node image with text prompt
router.post('/edit-image', editImageHandler);

// REDRAW Command - Transform scene to current host conditions (wrapper around editImage)
router.post('/redraw', redrawHandler);

// GENERATE_VIDEO_LOOP - Create seamless ambient motion video from image
router.post('/generate-video-loop', generateVideoLoopHandler);

export { router as worldV2Router };
