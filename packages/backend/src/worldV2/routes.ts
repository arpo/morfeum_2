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
  eventsHandler
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

export { router as worldV2Router };
