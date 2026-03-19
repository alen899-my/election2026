import { Request, Response } from 'express';
import { db } from '../config/db';
import { parties } from '../schema/parties';
import { eq } from 'drizzle-orm';

export const getAllParties = async (req: Request, res: Response) => {
  try {
    const all = await db.select().from(parties);
    res.json({ success: true, data: all });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch parties' });
  }
};

export const getPartyBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const [party] = await db.select().from(parties).where(eq(parties.slug, slug));
    
    if (!party) {
      return res.status(404).json({ success: false, error: 'Party not found' });
    }
    
    res.json({ success: true, data: party });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch party' });
  }
};
