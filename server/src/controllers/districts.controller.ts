import { Request, Response } from 'express';
import { db } from '../config/db';
import { districts } from '../schema/districts';

export const getAllDistricts = async (req: Request, res: Response) => {
  try {
    const all = await db.select().from(districts);
    res.json({ success: true, data: all });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch districts' });
  }
};
