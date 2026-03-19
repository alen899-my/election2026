import { Router } from 'express';
import { getAllConstituencies, getConstituencyBySlug } from '../controllers/constituencies.controller';

const router = Router();

router.get('/', getAllConstituencies);
router.get('/:slug', getConstituencyBySlug);

export default router;
