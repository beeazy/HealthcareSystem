import { Request, Response } from 'express';
import { db } from '../../db';
import { doctors, appointments } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod/v4';

// Validation schemas
const doctorSchema = z.object({
    firstName: z.string().min(2).max(100),
    lastName: z.string().min(2).max(100),
    email: z.email().max(255),
    phone: z.string().max(20).optional(),
    specialization: z.string().min(2).max(100),
    licenseNumber: z.string().min(5).max(50),
    isAvailable: z.boolean().optional(),
    isActive: z.boolean().optional(),
}).strict();

/**
 * @swagger
 * /doctors:
 *   get:
 *     tags:
 *       - Doctors
 *     summary: Get all active doctors
 *     description: Retrieve a list of all active doctors in the system
 *     responses:
 *       200:
 *         description: List of doctors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Doctor'
 *       500:
 *         description: Server error
 */
export async function getDoctors(req: Request, res: Response) {
    try {
        const allDoctors = await db.query.doctors.findMany({
            where: eq(doctors.isActive, true)
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
 *     description: Retrieve a specific doctor's details by their ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: Doctor details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Doctor'
 *       400:
 *         description: Invalid doctor ID
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Server error
 */
export async function getDoctorById(req: Request, res: Response): Promise<any> {
    try {
        const { id } = req.params;
        const doctorId = Number(id);
        
        if (isNaN(doctorId)) {
            return res.status(400).json({ error: 'Invalid doctor ID' });
        }

        const doctor = await db.query.doctors.findFirst({
            where: eq(doctors.id, doctorId)
        });

        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
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
 *     summary: Add a new doctor
 *     description: Create a new doctor record in the system
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DoctorInput'
 *     responses:
 *       201:
 *         description: Doctor created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Doctor'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
export async function addDoctor(req: Request, res: Response): Promise<any> {
    try {
        const validatedData = doctorSchema.parse(req.body);
        
        const [newDoctor] = await db.insert(doctors)
            .values({
                ...validatedData,
                createdAt: new Date(),
                updatedAt: new Date()
            })
            .returning();

        res.status(201).json(newDoctor);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                error: 'Validation error', 
                details: error 
            });
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
 *     summary: Update doctor details
 *     description: Update an existing doctor's information
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Doctor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DoctorInput'
 *     responses:
 *       200:
 *         description: Doctor updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Doctor'
 *       400:
 *         description: Invalid input or doctor ID
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Server error
 */
export async function updateDoctor(req: Request, res: Response): Promise<any> {
    try {
        const { id } = req.params;
        const doctorId = Number(id);
        
        if (isNaN(doctorId)) {
            return res.status(400).json({ error: 'Invalid doctor ID' });
        }

        const validatedData = doctorSchema.partial().parse(req.body);
        
        const [updatedDoctor] = await db.update(doctors)
            .set({
                ...validatedData,
                updatedAt: new Date()
            })
            .where(eq(doctors.id, doctorId))
            .returning();

        if (!updatedDoctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        res.json(updatedDoctor);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                error: 'Validation error', 
                details: error 
            });
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
            return res.status(400).json({ error: 'Invalid doctor ID' });
        }

        // check if the doctor has any appointments
        const existingAppointments = await db.query.appointments.findMany({
            where: eq(appointments.doctorId, doctorId)
        });

        if (existingAppointments.length > 0) {
            return res.status(400).json({ error: 'Doctor has appointments' });
        }

        // Soft delete by setting isActive to false
        const [deletedDoctor] = await db.update(doctors)
            .set({ 
                isActive: false,
                updatedAt: new Date()
            })
            .where(eq(doctors.id, doctorId))
            .returning();

        if (!deletedDoctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        res.json({ 
            message: 'Doctor deactivated successfully',
            doctor: deletedDoctor
        });
    } catch (error) {
        console.error('Error deactivating doctor:', error);
        res.status(500).json({ error: 'Failed to deactivate doctor' });
    }
}