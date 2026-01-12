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
  eventsHandler,
  setTimeHandler,
  setWeatherHandler
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

export { router as worldV2Router };
