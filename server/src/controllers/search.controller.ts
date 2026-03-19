import { Request, Response } from 'express';
import { db } from '../config/db';
import { candidates } from '../schema/candidates';
import { constituencies } from '../schema/constituencies';
import { or, ilike } from 'drizzle-orm';

export const globalSearch = async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    
    if (!q || q.length < 2) {
      return res.json({ success: true, data: { candidates: [], constituencies: [] } });
    }

    const searchPattern = `%${q}%`;

    // Native Postgres Text Search using ILIKE
    const matchedCandidates = await db.select()
      .from(candidates)
      .where(
        or(
          ilike(candidates.nameEn, searchPattern),
          ilike(candidates.nameMl, searchPattern)
        )
      )
      .limit(10);

    const matchedConstituencies = await db.select()
      .from(constituencies)
      .where(
        or(
          ilike(constituencies.nameEn, searchPattern),
          ilike(constituencies.nameMl, searchPattern)
        )
      )
      .limit(10);

    res.json({
      success: true,
      data: {
        candidates: matchedCandidates,
        constituencies: matchedConstituencies
      }
    });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Search failed' });
  }
};
