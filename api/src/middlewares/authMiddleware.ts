import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users, userRoleEnum, doctorProfiles, receptionistProfiles } from '../db/schema';
import { eq } from 'drizzle-orm';

type UserRole = typeof userRoleEnum.enumValues[number];

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: CustomJwtPayload;
        }
    }
}

interface CustomJwtPayload {
    userId: number;
    role: string;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as CustomJwtPayload;

        // Verify user still exists
        const user = await db.query.users.findFirst({
            where: eq(users.id, decoded.userId),
        });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

export const isDoctor = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'doctor') {
        return res.status(403).json({ error: 'Doctor access required' });
    }
    next();
};

export const isActiveDoctor = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'doctor' || !doctorProfiles.isActive) {
        return res.status(403).json({ message: 'Active doctor access required' });
    }
    next();
};

const ALLOWED_PATIENT_MANAGEMENT_ROLES = ['doctor', 'admin', 'receptionist'] as const;
type AllowedRole = typeof ALLOWED_PATIENT_MANAGEMENT_ROLES[number];

interface ProfileStatus {
    role: AllowedRole;
    isActive: boolean;
}

const checkProfileStatus = async (role: AllowedRole): Promise<ProfileStatus> => {
    switch (role) {
        case 'doctor':
            return { role, isActive: Boolean(doctorProfiles.isActive) };
        case 'receptionist':
            return { role, isActive: Boolean(receptionistProfiles.isActive) };
        case 'admin':
            return { role, isActive: true };
        default:
            return { role, isActive: false };
    }
};

export const isDoctorOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as AllowedRole;

    if (!userRole || !ALLOWED_PATIENT_MANAGEMENT_ROLES.includes(userRole)) {
        return res.status(403).json({ 
            status: 'error',
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Access denied: insufficient permissions' 
        });
    }

    const { isActive } = await checkProfileStatus(userRole);
    
    if (!isActive) {
        return res.status(403).json({ 
            status: 'error',
            code: 'INACTIVE_PROFILE',
            message: `Access denied: inactive ${userRole} profile` 
        });
    }

    next();
};

export const isPatient = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'patient') {
        return res.status(403).json({ error: 'Patient access required' });
    }
    next();
};

export const isRequestingAuthorizedData = (req: Request, res: Response, next: NextFunction) => {
    if (Number(req.params.id) !== req.user?.userId) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    next();
};

export const isActiveReceptionist = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'receptionist' || !receptionistProfiles.isActive) {
        return res.status(403).json({ message: 'Active receptionist access required' });
    }
    next();
};