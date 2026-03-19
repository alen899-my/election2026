import { Router } from 'express';
import { getAllCandidates, getCandidateBySlug, createCandidate } from '../controllers/candidates.controller';
import { requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', getAllCandidates);
router.get('/:slug', getCandidateBySlug);

// Protected routes
router.post('/', requireAdmin, createCandidate);

export default router;
