import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { doctors } from '../db/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const isDoctor = (req: Request, res: Response, next: NextFunction): any => {
  if (req.user?.role !== 'doctor') {
    return res.status(403).json({ error: 'Doctor access required' });
  }
  next();
};

export const hasDoctorAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role === 'admin') {
      return next();
    }

    if (req.user?.role !== 'doctor') {
      return res.status(403).json({ error: 'Doctor access required' });
    }

    const doctorId = req.params.doctorId || req.body.doctorId;
    if (!doctorId) {
      return res.status(400).json({ error: 'Doctor ID is required' });
    }

    // Check if the doctor exists and is active
    const [doctor] = await db
      .select()
      .from(doctors)
      .where(eq(doctors.id, doctorId));

    if (!doctor || !doctor.isActive) {
      return res.status(404).json({ error: 'Doctor not found or inactive' });
    }

    // Check if the requesting user is the doctor
    if (doctor.email !== req.user.email) {
      return res.status(403).json({ error: 'Access denied to this resource' });
    }

    next();
  } catch (error) {
    console.error('Doctor access check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 