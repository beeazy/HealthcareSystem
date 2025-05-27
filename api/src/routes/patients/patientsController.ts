import { Request, Response } from 'express';
import { db } from '../../db';
import { patients } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod/v4';

const patientSchema = z.object({
    fullName: z.string().min(2).max(100),
    dateOfBirth: z.date(),
    gender: z.string().min(2).max(100),
    contactInfo: z.string().min(2).max(100),
    insuranceProvider: z.string().min(2).max(100),
    insuranceNumber: z.string().min(2).max(100),
}).strict();

/**
 * @swagger
 * /patients:
 *   get:
 *     tags:
 *       - Patients
 *     summary: Get all patients
 *     description: Retrieve a list of all patients in the system
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
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
export async function getPatients(req: Request, res: Response): Promise<any> {

    const patients = await db.query.patients.findMany();
    res.send(patients);
};

/**
 * @swagger
 * /patients:
 *   post:
 *     tags:
 *       - Patients
 *     summary: Add a new patient
 *     description: Create a new patient record in the system
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - dateOfBirth
 *               - gender
 *               - contactInfo
 *               - insuranceProvider
 *               - insuranceNumber
 *             properties:
 *               fullName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               contactInfo:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               insuranceProvider:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               insuranceNumber:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *     responses:
 *       201:
 *         description: Patient created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
export async function addPatient(req: Request, res: Response): Promise<any> {
    const { success, data, error } = patientSchema.safeParse(req.body);
    if (!success) {
        return res.status(400).json({ error: error.message });
    }
    const patient = await db.insert(patients).values(
        {
            fullName: data.fullName,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
            contactInfo: data.contactInfo,
            insuranceProvider: data.insuranceProvider,
            insuranceNumber: data.insuranceNumber
        }
    );
    res.send(patient);
};

/**
 * @swagger
 * /patients/{id}:
 *   put:
 *     tags:
 *       - Patients
 *     summary: Update patient details
 *     description: Update an existing patient's information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Patient ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               contactInfo:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               insuranceProvider:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               insuranceNumber:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *     responses:
 *       200:
 *         description: Patient updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Validation error or invalid patient ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 */
export async function updatePatient(req: Request, res: Response): Promise<any> {
    const { id } = req.params;
    const { success, data, error } = patientSchema.partial().safeParse(req.body);
    if (!success) {
        return res.status(400).json({ error: error.message });
    }
    const patient = await db.update(patients).set(data).where(eq(patients.id, parseInt(id)));
    res.send(patient);
};

/**
 * @swagger
 * /patients/{id}:
 *   delete:
 *     tags:
 *       - Patients
 *     summary: Delete a patient
 *     description: Permanently remove a patient from the system
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Patient ID
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
 *         description: Unauthorized
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 */
export async function deletePatient(req: Request, res: Response): Promise<any> {
    try {
        const { id } = req.params;
        const patientId = Number(id);
        
        if (isNaN(patientId)) {
            return res.status(400).json({ 
                error: 'Invalid patient ID' 
            });
        }

        const deletedPatient = await db.delete(patients)
            .where(eq(patients.id, patientId))
            .returning();

        if (!deletedPatient.length) {
            return res.status(404).json({ 
                error: 'Patient not found' 
            });
        }

        res.status(200).json({ 
            message: 'Patient deleted successfully',
            patient: deletedPatient[0]
        });
    } catch (error) {
        console.error('Error deleting patient:', error);
        res.status(500).json({ 
            error: 'Failed to delete patient' 
        });
    }
}

