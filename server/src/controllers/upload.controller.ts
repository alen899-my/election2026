import { Request, Response } from 'express';
import { uploadResizedImage } from '../services/upload.service';

export const uploadPhoto = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    // Call S3 Cloudflare Service with generic randomName to avoid collisions
    const url = await uploadResizedImage(req.file.buffer, req.file.originalname);

    res.json({
      success: true,
      data: { url }
    });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Image uploaded failed' });
  }
};
