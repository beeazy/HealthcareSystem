import { Request, Response } from 'express';
import { db } from '../../db';
import { users, doctorProfiles } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod/v4';

// Validation schemas
const doctorSchema = z.object({
    email: z.email().max(255),
    password: z.string().min(6),
    fullName: z.string().min(2).max(100),
    phone: z.string().max(20).optional(),
    specialization: z.string().min(2).max(100),
    licenseNumber: z.string().min(5).max(50),
}).strict();

/**
 * @swagger
 * /doctors:
 *   get:
 *     tags:
 *       - Doctors
 *     summary: Get all doctors
 *     description: Retrieve a list of all doctors in the system, including their profiles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of doctors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Doctor'
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Internal server error
 */
export async function getDoctors(req: Request, res: Response): Promise<any> {
    try {
        const allDoctors = await db.query.users.findMany({
            where: eq(users.role, 'doctor'),
            with: {
                doctorProfile: true
            }
        });
        res.json(allDoctors);
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ error: 'Failed to fetch doctors' });
    }
}

/**
 * @swagger
 * /doctors/{id}:
 *   get:
 *     tags:
 *       - Doctors
 *     summary: Get doctor by ID
 *     description: Retrieve detailed information about a specific doctor by their ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The unique identifier of the doctor
 *     responses:
 *       200:
 *         description: Doctor details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Doctor'
 *       400:
 *         description: Invalid doctor ID format
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Internal server error
 */
export async function getDoctorById(req: Request, res: Response): Promise<any> {
    try {
        const { id } = req.params;
        const doctorId = Number(id);
        
        if (isNaN(doctorId)) {
            res.status(400).json({ error: 'Invalid doctor ID' });
            return;
        }

        const doctor = await db.query.users.findFirst({
            where: and(
                eq(users.id, doctorId),
                eq(users.role, 'doctor')
            ),
            with: {
                doctorProfile: true
            }
        });

        if (!doctor) {
            res.status(404).json({ error: 'Doctor not found' });
            return;
        }

        res.json(doctor);
    } catch (error) {
        console.error('Error fetching doctor:', error);
        res.status(500).json({ error: 'Failed to fetch doctor' });
    }
}

/**
 * @swagger
 * /doctors:
 *   post:
 *     tags:
 *       - Doctors
 *     summary: Create new doctor
 *     description: Register a new doctor in the system with their profile information
 *     security:
 *       - bearerAuth: []
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
 *                 minLength: 2
 *                 maxLength: 100
 *               phone:
 *                 type: string
 *                 maxLength: 20
 *               specialization:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               licenseNumber:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 50
 *     responses:
 *       201:
 *         description: Doctor created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Doctor'
 *       400:
 *         description: Validation error in request body
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Internal server error
 */
export async function addDoctor(req: Request, res: Response): Promise<any> {
    try {
        const validatedData = doctorSchema.parse(req.body);
        
        const [user] = await db.insert(users).values({
            email: validatedData.email,
            password: validatedData.password, // Note: Should be hashed in production
            fullName: validatedData.fullName,
            phone: validatedData.phone,
            role: 'doctor',
        }).returning();

        const [doctorProfile] = await db.insert(doctorProfiles).values({
            userId: user.id,
            specialization: validatedData.specialization,
            licenseNumber: validatedData.licenseNumber,
        }).returning();

        res.status(201).json({
            ...user,
            doctorProfile
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ 
                error: 'Validation error', 
                details: error 
            });
            return;
        }
        
        console.error('Error adding doctor:', error);
        res.status(500).json({ error: 'Failed to add doctor' });
    }
}

/**
 * @swagger
 * /doctors/{id}:
 *   put:
 *     tags:
 *       - Doctors
 *     summary: Update doctor information
 *     description: Update an existing doctor's personal and professional information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The unique identifier of the doctor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               fullName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               phone:
 *                 type: string
 *                 maxLength: 20
 *               specialization:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               licenseNumber:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 50
 *     responses:
 *       200:
 *         description: Doctor information updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Doctor'
 *       400:
 *         description: Invalid input or doctor ID
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Internal server error
 */
export async function updateDoctor(req: Request, res: Response): Promise<any> {
    try {
        const { id } = req.params;
        const doctorId = Number(id);
        
        if (isNaN(doctorId)) {
            res.status(400).json({ error: 'Invalid doctor ID' });
            return;
        }

        const validatedData = doctorSchema.partial().parse(req.body);
        
        // Update user data
        const [updatedUser] = await db.update(users)
            .set({
                email: validatedData.email,
                fullName: validatedData.fullName,
                phone: validatedData.phone,
                updatedAt: new Date()
            })
            .where(and(
                eq(users.id, doctorId),
                eq(users.role, 'doctor')
            ))
            .returning();

        if (!updatedUser) {
            res.status(404).json({ error: 'Doctor not found' });
            return;
        }

        // Update doctor profile
        const [updatedProfile] = await db.update(doctorProfiles)
            .set({
                specialization: validatedData.specialization,
                licenseNumber: validatedData.licenseNumber,
                updatedAt: new Date()
            })
            .where(eq(doctorProfiles.userId, doctorId))
            .returning();

        res.json({
            ...updatedUser,
            doctorProfile: updatedProfile
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ 
                error: 'Validation error', 
                details: error 
            });
            return;
        }
        
        console.error('Error updating doctor:', error);
        res.status(500).json({ error: 'Failed to update doctor' });
    }
}

/**
 * @swagger
 * /doctors/{id}/deactivate:
 *   put:
 *     tags:
 *       - Doctors
 *     summary: Deactivate a doctor
 *     description: Soft delete a doctor by setting isActive to false
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: Doctor deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 doctor:
 *                   $ref: '#/components/schemas/Doctor'
 *       400:
 *         description: Invalid doctor ID or doctor has appointments
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Server error
 */
export async function deactivateDoctor(req: Request, res: Response): Promise<any> {
    try {
        const { id } = req.params;
        const doctorId = Number(id);
        
        if (isNaN(doctorId)) {
            res.status(400).json({ error: 'Invalid doctor ID' });
            return;
        }

        // Update doctor profile to set isActive to false
        const [updatedProfile] = await db.update(doctorProfiles)
            .set({ 
                isActive: false,
                updatedAt: new Date()
            })
            .where(eq(doctorProfiles.userId, doctorId))
            .returning();

        if (!updatedProfile) {
            res.status(404).json({ error: 'Doctor not found' });
            return;
        }

        res.json({ 
            message: 'Doctor deactivated successfully',
            doctor: updatedProfile
        });
    } catch (error) {
        console.error('Error deactivating doctor:', error);
        res.status(500).json({ error: 'Failed to deactivate doctor' });
    }
}