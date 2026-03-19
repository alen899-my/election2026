import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { uploadPhoto } from '../controllers/upload.controller';

const router = Router();

// Apply requireAdmin and multer array memory processing
router.post('/photo', requireAdmin, upload.single('photo'), uploadPhoto);

export default router;
