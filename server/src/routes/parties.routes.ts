import { Router } from 'express';
import { getAllParties, getPartyBySlug } from '../controllers/parties.controller';

const router = Router();

router.get('/', getAllParties);
router.get('/:slug', getPartyBySlug);

export default router;
