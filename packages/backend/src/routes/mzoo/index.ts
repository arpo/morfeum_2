/**
 * MZOO Routes Index
 * Combines all MZOO-related routes with shared middleware
 */

import { Router } from 'express';
import { validateMzooApiKey } from '../../middleware/mzooAuth';
import { promptsRouter } from './prompts';
import { aiRouter } from './ai';
import { navigationRouter } from './navigation';
import locationsRouter from './locations';
import hierarchyRouter from './hierarchy';
import { cacheRouter } from './cache';

const router = Router();

// Apply MZOO API key validation to all routes
router.use(validateMzooApiKey);

// Mount route modules
router.use('/prompts', promptsRouter);
router.use('/navigation', navigationRouter);
router.use('/locations', locationsRouter);
router.use('/hierarchy', hierarchyRouter);
router.use('/cache', cacheRouter);
router.use('/', aiRouter);

export { router as mzooRouter };
