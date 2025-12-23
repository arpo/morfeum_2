/**
 * Storage Routes - API endpoints for worlds and characters persistence
 */

import { Router } from 'express';
import { worldsRouter } from './storage/worldsRoutes';
import { charactersRouter } from './storage/charactersRoutes';

const router = Router();

// Mount sub-routers
router.use('/worlds', worldsRouter);
router.use('/characters', charactersRouter);

export default router;
