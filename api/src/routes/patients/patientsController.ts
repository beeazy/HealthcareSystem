import { Request, Response } from 'express';
import { db } from '../../db';
import { users, patientProfiles, medicalRecords, appointments } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod/v4';

interface CustomJwtPayload {
    userId: number;
    role: string;
}

const patientSchema = z.object({
    email: z.email().max(255),
    password: z.string().min(6),
    fullName: z.string().min(2).max(100),
    phone: z.string().max(20).optional(),
    dateOfBirth: z.string().length(10), // Format: YYYY-MM-DD
    gender: z.string().min(2).max(10),
    insuranceProvider: z.string().min(2).max(100).optional(),
    insuranceNumber: z.string().min(2).max(50).optional(),
}).strict();

const medicalRecordSchema = z.object({
    diagnosis: z.string().min(1),
    prescription: z.string().optional(),
    notes: z.string().optional(),
    appointmentId: z.number().optional(),
}).strict();

/**
 * @swagger
 * /patients:
 *   get:
 *     tags:
 *       - Patients
 *     summary: Get all patients
 *     description: Retrieve a list of all patients in the system with their profiles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of patients retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Patient'
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Internal server error
 */
export async function getPatients(req: Request, res: Response): Promise<any> {
    try {
        const allPatients = await db.query.users.findMany({
            where: eq(users.role, 'patient'),
            with: {
                patientProfile: true
            }
        });
        res.json(allPatients);
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ error: 'Failed to fetch patients' });
    }
}

/**
 * @swagger
 * /patients:
 *   post:
 *     tags:
 *       - Patients
 *     summary: Create new patient
 *     description: Register a new patient in the system with their profile information
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
 *               - dateOfBirth
 *               - gender
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
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 pattern: '^\\d{4}-\\d{2}-\\d{2}$'
 *               gender:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 10
 *               insuranceProvider:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               insuranceNumber:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *     responses:
 *       201:
 *         description: Patient created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Validation error in request body
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Internal server error
 */
export async function addPatient(req: Request, res: Response): Promise<any> {
    try {
        const validatedData = patientSchema.parse(req.body);
        
        const [user] = await db.insert(users).values({
            email: validatedData.email,
            password: validatedData.password, // Note: Should be hashed in production
            fullName: validatedData.fullName,
            phone: validatedData.phone,
            role: 'patient',
        }).returning();

        const [patientProfile] = await db.insert(patientProfiles).values({
            userId: user.id,
            dateOfBirth: validatedData.dateOfBirth,
            gender: validatedData.gender,
            insuranceProvider: validatedData.insuranceProvider,
            insuranceNumber: validatedData.insuranceNumber,
        }).returning();

        res.status(201).json({
            ...user,
            patientProfile
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ 
                error: 'Validation error', 
                details: error 
            });
            return;
        }
        
        console.error('Error adding patient:', error);
        res.status(500).json({ error: 'Failed to add patient' });
    }
}

/**
 * @swagger
 * /patients/{id}:
 *   put:
 *     tags:
 *       - Patients
 *     summary: Update patient information
 *     description: Update an existing patient's personal and profile information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The unique identifier of the patient
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
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 pattern: '^\\d{4}-\\d{2}-\\d{2}$'
 *               gender:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 10
 *               insuranceProvider:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               insuranceNumber:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *     responses:
 *       200:
 *         description: Patient information updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Invalid input or patient ID
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Internal server error
 */
export async function updatePatient(req: Request, res: Response): Promise<any> {
    try {
        const { id } = req.params;
        const patientId = Number(id);
        
        if (isNaN(patientId)) {
            res.status(400).json({ error: 'Invalid patient ID' });
            return;
        }

        const validatedData = patientSchema.partial().parse(req.body);
        
        // Update user data
        const [updatedUser] = await db.update(users)
            .set({
                email: validatedData.email,
                fullName: validatedData.fullName,
                phone: validatedData.phone,
                updatedAt: new Date()
            })
            .where(and(
                eq(users.id, patientId),
                eq(users.role, 'patient')
            ))
            .returning();

        if (!updatedUser) {
            res.status(404).json({ error: 'Patient not found' });
            return;
        }

        // Update patient profile
        const [updatedProfile] = await db.update(patientProfiles)
            .set({
                dateOfBirth: validatedData.dateOfBirth,
                gender: validatedData.gender,
                insuranceProvider: validatedData.insuranceProvider,
                insuranceNumber: validatedData.insuranceNumber,
                updatedAt: new Date()
            })
            .where(eq(patientProfiles.userId, patientId))
            .returning();

        res.json({
            ...updatedUser,
            patientProfile: updatedProfile
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ 
                error: 'Validation error', 
                details: error 
            });
            return;
        }
        
        console.error('Error updating patient:', error);
        res.status(500).json({ error: 'Failed to update patient' });
    }
}

/**
 * @swagger
 * /patients/{id}:
 *   delete:
 *     tags:
 *       - Patients
 *     summary: Delete a patient
 *     description: Permanently remove a patient and their profile from the system
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The unique identifier of the patient
 *     responses:
 *       200:
 *         description: Patient deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 patient:
 *                   $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Invalid patient ID
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Internal server error
 */
export async function deletePatient(req: Request, res: Response): Promise<any> {
    try {
        const { id } = req.params;
        const patientId = Number(id);
        
        if (isNaN(patientId)) {
            res.status(400).json({ error: 'Invalid patient ID' });
            return;
        }

        // First delete the patient profile
        const [deletedProfile] = await db.delete(patientProfiles)
            .where(eq(patientProfiles.userId, patientId))
            .returning();

        if (!deletedProfile) {
            res.status(404).json({ error: 'Patient not found' });
            return;
        }

        // Then delete the user record
        const [deletedUser] = await db.delete(users)
            .where(and(
                eq(users.id, patientId),
                eq(users.role, 'patient')
            ))
            .returning();

        res.json({ 
            message: 'Patient deleted successfully',
            patient: {
                ...deletedUser,
                patientProfile: deletedProfile
            }
        });
    } catch (error) {
        console.error('Error deleting patient:', error);
        res.status(500).json({ error: 'Failed to delete patient' });
    }
}

/**
 * @swagger
 * /patients/{id}:
 *   get:
 *     tags:
 *       - Patients
 *     summary: Get a single patient
 *     description: Retrieve detailed information about a specific patient
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The unique identifier of the patient
 *     responses:
 *       200:
 *         description: Patient information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Internal server error
 */
export async function getPatient(req: Request, res: Response): Promise<any> {
    try {
        const { id } = req.params;
        const patientId = Number(id);
        
        if (isNaN(patientId)) {
            res.status(400).json({ error: 'Invalid patient ID' });
            return;
        }

        const patient = await db.query.users.findFirst({
            where: and(
                eq(users.id, patientId),
                eq(users.role, 'patient')
            ),
            with: {
                patientProfile: true
            }
        });

        if (!patient) {
            res.status(404).json({ error: 'Patient not found' });
            return;
        }

        res.json(patient);
    } catch (error) {
        console.error('Error fetching patient:', error);
        res.status(500).json({ error: 'Failed to fetch patient' });
    }
}

/**
 * @swagger
 * /patients/{id}/records:
 *   get:
 *     tags:
 *       - Patients
 *     summary: Get patient medical records
 *     description: Retrieve all medical records for a specific patient
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The unique identifier of the patient
 *     responses:
 *       200:
 *         description: Patient records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MedicalRecord'
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Internal server error
 */
export async function getPatientRecords(req: Request, res: Response): Promise<any> {
    try {
        const { id } = req.params;
        const patientId = Number(id);
        
        if (isNaN(patientId)) {
            res.status(400).json({ error: 'Invalid patient ID' });
            return;
        }

        // First check if patient exists
        const patient = await db.query.users.findFirst({
            where: and(
                eq(users.id, patientId),
                eq(users.role, 'patient')
            )
        });

        if (!patient) {
            res.status(404).json({ error: 'Patient not found' });
            return;
        }

        const records = await db.query.medicalRecords.findMany({
            where: eq(medicalRecords.patientId, patientId),
            with: {
                doctor: {
                    columns: {
                        id: true,
                        fullName: true
                    }
                }
            },
            orderBy: (records, { desc }) => [desc(records.createdAt)]
        });

        // Transform the records to match the frontend interface
        const transformedRecords = records.map(record => ({
            id: record.id,
            patientId: record.patientId,
            date: record.createdAt.toISOString(),
            diagnosis: record.diagnosis,
            treatment: record.prescription || '',
            notes: record.notes,
            doctorId: record.doctorId,
            doctorName: record.doctor.fullName,
            medications: record.prescription ? [record.prescription] : [],
            allergies: []
        }));

        res.json(transformedRecords);
    } catch (error) {
        console.error('Error fetching patient records:', error);
        res.status(500).json({ error: 'Failed to fetch patient records' });
    }
}

/**
 * @swagger
 * /patients/{id}/appointments:
 *   get:
 *     tags:
 *       - Patients
 *     summary: Get patient appointments
 *     description: Retrieve all appointments for a specific patient
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The unique identifier of the patient
 *     responses:
 *       200:
 *         description: Patient appointments retrieved successfully
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Internal server error
 */
export async function getPatientAppointments(req: Request, res: Response): Promise<any> {
    try {
        const { id } = req.params;
        const patientId = Number(id);
        
        if (isNaN(patientId)) {
            res.status(400).json({ error: 'Invalid patient ID' });
            return;
        }

        // First check if patient exists
        const patient = await db.query.users.findFirst({
            where: and(
                eq(users.id, patientId),
                eq(users.role, 'patient')
            )
        });

        if (!patient) {
            res.status(404).json({ error: 'Patient not found' });
            return;
        }

        const patientAppointments = await db.query.appointments.findMany({
            where: eq(appointments.patientId, patientId),
            with: {
                doctor: {
                    columns: {
                        id: true,
                        fullName: true
                    }
                }
            },
            orderBy: (appointments, { desc }) => [desc(appointments.startTime)]
        });

        res.json(patientAppointments);
    } catch (error) {
        console.error('Error fetching patient appointments:', error);
        res.status(500).json({ error: 'Failed to fetch patient appointments' });
    }
}

/**
 * @swagger
 * /patients/{id}/records:
 *   post:
 *     tags:
 *       - Patients
 *     summary: Create medical record
 *     description: Create a new medical record for a patient
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The unique identifier of the patient
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - diagnosis
 *             properties:
 *               diagnosis:
 *                 type: string
 *               prescription:
 *                 type: string
 *               notes:
 *                 type: string
 *               appointmentId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Medical record created successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Internal server error
 */
export async function createMedicalRecord(req: Request, res: Response): Promise<any> {
    try {
        const { id } = req.params;
        const patientId = Number(id);
        
        if (!req.user?.userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (isNaN(patientId)) {
            res.status(400).json({ error: 'Invalid patient ID' });
            return;
        }

        // First check if patient exists
        const patient = await db.query.users.findFirst({
            where: and(
                eq(users.id, patientId),
                eq(users.role, 'patient')
            )
        });

        if (!patient) {
            res.status(404).json({ error: 'Patient not found' });
            return;
        }

        const validatedData = medicalRecordSchema.parse(req.body);

        // If appointmentId is provided, verify it exists and belongs to the patient
        if (validatedData.appointmentId) {
            const appointment = await db.query.appointments.findFirst({
                where: and(
                    eq(appointments.id, validatedData.appointmentId),
                    eq(appointments.patientId, patientId)
                )
            });

            if (!appointment) {
                res.status(400).json({ error: 'Invalid appointment ID or appointment does not belong to patient' });
                return;
            }
        }

        const [record] = await db.insert(medicalRecords).values({
            patientId,
            doctorId: req.user.userId,
            appointmentId: validatedData.appointmentId,
            diagnosis: validatedData.diagnosis,
            prescription: validatedData.prescription,
            notes: validatedData.notes,
        }).returning();

        res.status(201).json(record);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ 
                error: 'Validation error', 
                details: error 
            });
            return;
        }
        
        console.error('Error creating medical record:', error);
        res.status(500).json({ error: 'Failed to create medical record' });
    }
}

