import { Router } from 'express';
import { getAllDistricts } from '../controllers/districts.controller';

const router = Router();

router.get('/', getAllDistricts);

export default router;
