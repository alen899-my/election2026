import { Router } from 'express';
import { runScrapingJob } from '../controllers/scraper.controller';
import { requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// This is an intensive DB write process so it must remain strictly protected behind Auth MW.
router.post('/sync', requireAdmin, runScrapingJob);

export default router;
