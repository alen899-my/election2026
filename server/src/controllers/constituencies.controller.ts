import { Request, Response } from 'express';
import { db } from '../config/db';
import { constituencies } from '../schema/constituencies';
import { eq } from 'drizzle-orm';

export const getAllConstituencies = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 140; // All 140 Kerala constituencies
    const all = await db.select().from(constituencies).limit(limit);
    
    res.json({ success: true, data: all });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch constituencies' });
  }
};

export const getConstituencyBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const [constituency] = await db.select().from(constituencies).where(eq(constituencies.slug, slug));
    
    if (!constituency) {
      return res.status(404).json({ success: false, error: 'Constituency not found' });
    }
    
    res.json({ success: true, data: constituency });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch constituency' });
  }
};
