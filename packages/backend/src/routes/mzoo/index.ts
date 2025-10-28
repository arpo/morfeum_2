/**
 * MZOO Routes Index
 * Combines all MZOO-related routes with shared middleware
 */

import { Router } from 'express';
import { validateMzooApiKey } from '../../middleware/mzooAuth';
import { promptsRouter } from './prompts';
import { seedRouter } from './seed';
import { imageRouter } from './image';
import { profileRouter } from './profile';
import { aiRouter } from './ai';
import { navigatorRouter } from './navigator';
import { navigationRouter } from './navigation';
import locationsRouter from './locations';
import hierarchyRouter from './hierarchy';

const router = Router();

// Apply MZOO API key validation to all routes
router.use(validateMzooApiKey);

// Mount route modules
router.use('/prompts', promptsRouter);
router.use('/entity', seedRouter);
router.use('/entity', imageRouter);
router.use('/entity', profileRouter);
router.use('/navigator', navigatorRouter);
router.use('/navigation', navigationRouter);
router.use('/locations', locationsRouter);
router.use('/hierarchy', hierarchyRouter);
router.use('/', aiRouter);

export { router as mzooRouter };
