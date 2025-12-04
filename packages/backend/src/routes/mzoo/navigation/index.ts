/**
 * Navigation Routes
 * Node creation and navigation commands
 */

import { Router } from 'express';
import { asyncHandler } from '../../../middleware/errorHandler';
import { commandHandler } from './handlers/commandHandler';
import { createNodeHandler } from './handlers/createNodeHandler';
import { createImageHandler } from './handlers/createImageHandler';
import { eventsHandler } from './handlers/eventsHandler';

const router = Router();

// POST /api/mzoo/navigation/command - Execute navigation slash commands
router.post('/command', asyncHandler(commandHandler));

// POST /api/mzoo/navigation/create-node - Create new nodes
router.post('/create-node', asyncHandler(createNodeHandler));

// POST /api/mzoo/navigation/create-image - Generate images for nodes
router.post('/create-image', asyncHandler(createImageHandler));

// GET /api/mzoo/navigation/events/:navigationId - SSE stream for events
router.get('/events/:navigationId', asyncHandler(eventsHandler));

export { router as navigationRouter };
