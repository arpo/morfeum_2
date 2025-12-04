/**
 * Spawn Routes Index - Main router that mounts all spawn sub-routers
 */

import { Router } from 'express';
import { validateMzooApiKey } from '../../middleware/mzooAuth';

// Import sub-routers
import { characterRouter } from './characterRoutes';
import { locationRouter } from './locationRoutes';
import { nodeRouter } from './nodeRoutes';
import { hierarchyRouter } from './hierarchyRoutes';
import { utilityRouter } from './utilityRoutes';

const router = Router();

// Apply MZOO API key validation to all routes
router.use(validateMzooApiKey);

// Mount sub-routers
router.use(characterRouter);   // /engine/start
router.use(locationRouter);    // /location/start
router.use(nodeRouter);        // /node/:nodeType
router.use(hierarchyRouter);   // /hierarchy
router.use(utilityRouter);     // /events/:spawnId, /:spawnId (DELETE), /active

export { router as spawnRouter };
