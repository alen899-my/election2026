import { Request, Response } from 'express';
import { db } from '../config/db';
import { candidates } from '../schema/candidates';
import { eq } from 'drizzle-orm';

export const getAllCandidates = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    
    const allCandidates = await db.select().from(candidates).limit(limit).offset(offset);
    
    res.json({ success: true, data: allCandidates });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch candidates' });
  }
};

export const getCandidateBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    
    const [candidate] = await db.select().from(candidates).where(eq(candidates.slug, slug));
    
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }
    
    res.json({ success: true, data: candidate });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch candidate' });
  }
};

export const createCandidate = async (req: Request, res: Response) => {
  // Secured by requireAdmin middleware
  try {
    // Basic body pass-through for demo purposes, Zod validation should be added here
    const [newCandidate] = await db.insert(candidates).values(req.body).returning();
    
    res.status(201).json({ success: true, data: newCandidate });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || 'Failed to create candidate' });
  }
};
