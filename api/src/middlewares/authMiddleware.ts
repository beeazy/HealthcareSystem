import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { doctors } from '../db/schema';

const JWT_SECRET = process.env.JWT_SECRET || '';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        role: 'admin' | 'doctor';
        email: string;
      };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): any => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      role: 'admin' | 'doctor';
      email: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction): any => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
};

export const isActiveDoctor = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    // Admins have full access
    if (req.user?.role === 'admin') {
      return next();
    }

    // Check if user is a doctor
    if (req.user?.role !== 'doctor') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Check if the doctor is active
    const [doctor] = await db
      .select()
      .from(doctors)
      .where(eq(doctors.email, req.user.email));

    if (!doctor || !doctor.isActive) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    next();
  } catch (error) {
    console.error('Doctor access check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 