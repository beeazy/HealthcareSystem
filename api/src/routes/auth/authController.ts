import { Request, Response } from 'express';
import { db } from '../../db';
import { users, patientProfiles, doctorProfiles } from '../../db/schema';
import { RegisterInput, LoginInput, CreateDoctorInput, createDoctorSchema, registerSchema } from './auth.schema';
import { hash, compare } from 'bcrypt';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { z } from 'zod/v4';

const JWT_SECRET = process.env.JWT_SECRET || '';
const ADMIN_CREATION_KEY = process.env.ADMIN_CREATION_KEY;

export const createAdminSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  firstName: z.string(),
  lastName: z.string(),
  adminKey: z.string().min(1)
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new patient
 *     description: Create a new patient account with the provided credentials
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               fullName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Patient registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: User already exists
 *       500:
 *         description: Internal server error
 */
export async function register(req: Request<{}, {}, RegisterInput>, res: Response): Promise<any> {
    try {
        const { email, password, fullName } = registerSchema.parse(req.body);

        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        const hashedPassword = await hash(password, 10);

        const [user] = await db.insert(users).values({
            email,
            password: hashedPassword,
            fullName,
            role: 'patient',
        }).returning();

        await db.insert(patientProfiles).values({
            userId: user.id,
            dateOfBirth: '',
            gender: '',
        });

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login user
 *     description: Authenticate user and return JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
export async function login(req: Request<{}, {}, LoginInput>, res: Response): Promise<any> {
    try {
        const { email, password } = req.body;

        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        const isValidPassword = await compare(password, user.password);

        if (!isValidPassword) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * @swagger
 * /auth/doctor:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Create a new doctor account
 *     description: Create a new doctor account with the provided credentials and professional details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *               - phone
 *               - specialization
 *               - licenseNumber
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               specialization:
 *                 type: string
 *               licenseNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Doctor created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: User already exists
 *       500:
 *         description: Internal server error
 */
export async function createDoctor(req: Request<{}, {}, CreateDoctorInput>, res: Response): Promise<any> {
    try {
        const { email, password, fullName, phone, specialization, licenseNumber } = createDoctorSchema.parse(req.body);

        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        const hashedPassword = await hash(password, 10);

        const [user] = await db.insert(users).values({
            email,
            password: hashedPassword,
            fullName,
            phone,
            role: 'doctor',
        }).returning();

        await db.insert(doctorProfiles).values({
            userId: user.id,
            specialization,
            licenseNumber,
        });

        res.status(201).json({
            message: 'Doctor created successfully',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Doctor creation error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export async function createAdmin(req: Request<{}, {}, z.infer<typeof createAdminSchema>>, res: Response): Promise<any> {
    try {
        const { adminKey, ...userData } = createAdminSchema.parse(req.body);

        if (!ADMIN_CREATION_KEY || adminKey !== ADMIN_CREATION_KEY) {
            res.status(403).json({ message: 'Invalid admin key' });
            return;
        }

        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, userData.email),
        });

        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        const hashedPassword = await hash(userData.password, 10);

        const [newUser] = await db.insert(users).values({
            ...userData,
            password: hashedPassword,
            role: 'admin',
            fullName: `${userData.firstName} ${userData.lastName}`,
        }).returning();

        const token = jwt.sign(
            { userId: newUser.id, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                fullName: newUser.fullName,
                role: newUser.role,
            },
        });
    } catch (error) {
        console.error('Admin creation error:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ 
                message: 'Validation error' 
            });
            return;
        }
        res.status(500).json({ message: 'Internal server error' });
    }
}

export async function getUsers(req: Request, res: Response): Promise<any> {
    try {
        const allUsers = await db.query.users.findMany({
            columns: {
                password: false
            }
        });
        res.json(allUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}