import { Request, Response, NextFunction } from 'express';
import { verify, JwtPayload } from 'jsonwebtoken';
import { db } from '../db';
import { users, userRoleEnum, doctorProfiles } from '../db/schema';
import { eq } from 'drizzle-orm';

type UserRole = typeof userRoleEnum.enumValues[number];

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                role: UserRole;
            };
        }
    }
}

interface CustomJwtPayload extends JwtPayload {
    userId: number;
    role: UserRole;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verify(token, process.env.JWT_SECRET!) as CustomJwtPayload;

        // Verify user still exists
        const user = await db.query.users.findFirst({
            where: eq(users.id, decoded.userId),
        });

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = {
            id: decoded.userId,
            role: decoded.role,
        };

        next();
    } catch (error) {
        if (error instanceof Error) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        next(error);
    }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

export const isDoctor = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'doctor') {
        return res.status(403).json({ message: 'Doctor access required' });
    }
    next();
};

export const isActiveDoctor = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'doctor' || !doctorProfiles.isActive) {
        return res.status(403).json({ message: 'Active doctor access required' });
    }
    next();
};

export const isPatient = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'patient') {
        return res.status(403).json({ message: 'Patient access required' });
    }
    next();
}; 