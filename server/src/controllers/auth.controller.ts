import { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env';
import { signAdminToken } from '../utils/jwt';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    if (email !== env.ADMIN_EMAIL || password !== env.ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = await signAdminToken();

    res.json({
      success: true,
      data: {
        token,
        user: { email, role: 'admin' }
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
