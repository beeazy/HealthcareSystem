import { Request, Response } from 'express';
import { db } from '../../db';
import { medicalRecords, patients, doctors } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod/v4';

/**
 * @swagger
 * components:
 *   schemas:
 *     MedicalRecord:
 *       type: object
 *       required:
 *         - patientId
 *         - doctorId
 *         - diagnosis
 *       properties:
 *         patientId:
 *           type: integer
 *           description: ID of the patient
 *         doctorId:
 *           type: integer
 *           description: ID of the doctor
 *         diagnosis:
 *           type: string
 *           description: Medical diagnosis
 *         prescription:
 *           type: string
 *           description: Prescribed medication
 *         notes:
 *           type: string
 *           description: Additional medical notes
 */

const medicalRecordSchema = z.object({
    patientId: z.number().int().positive(),
    doctorId: z.number().int().positive(),
    diagnosis: z.string().min(1),
    prescription: z.string().optional(),
    notes: z.string().optional(),
}).strict();

/**
 * @swagger
 * /records:
 *   post:
 *     summary: Add a new medical record
 *     tags: [Medical Records]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MedicalRecord'
 *     responses:
 *       201:
 *         description: Medical record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MedicalRecord'
 *       404:
 *         description: Patient or doctor not found
 *       500:
 *         description: Server error
 */
export async function addMedicalRecord(req: Request, res: Response): Promise<any> {
    try {
        const validatedData = medicalRecordSchema.parse(req.body);
        
        // Validate patient exists
        const patient = await db.query.patients.findFirst({
            where: eq(patients.id, validatedData.patientId)
        });

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        // Validate doctor exists
        const doctor = await db.query.doctors.findFirst({
            where: eq(doctors.id, validatedData.doctorId)
        });

        if (!doctor || !doctor.isActive) {
            return res.status(404).json({ error: 'Doctor not found' });
        }
        
        const [newRecord] = await db.insert(medicalRecords)
            .values({
                ...validatedData,
                createdAt: new Date(),
                updatedAt: new Date()
            })
            .returning();

        res.status(201).json(newRecord);
    } catch (error) {
        console.error('Error adding medical record:', error);
        res.status(500).json({ error: 'Failed to add medical record' });
    }
}

/**
 * @swagger
 * /records/{id}:
 *   get:
 *     summary: Get a specific medical record
 *     tags: [Medical Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Medical record ID
 *     responses:
 *       200:
 *         description: Medical record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MedicalRecord'
 *       404:
 *         description: Medical record not found
 *       500:
 *         description: Server error
 */
export async function viewSpecificMedicalRecord(req: Request, res: Response): Promise<any> {
    try {
        const { id } = req.params;
        const recordId = Number(id);
        
        if (isNaN(recordId)) {
            return res.status(400).json({ error: 'Invalid record ID' });
        }

        const record = await db.query.medicalRecords.findFirst({
            where: eq(medicalRecords.id, recordId),
            with: {
                patient: true,
                doctor: true
            }
        });

        if (!record) {
            return res.status(404).json({ error: 'Medical record not found' });
        }

        res.json(record);
    } catch (error) {
        console.error('Error fetching medical record:', error);
        res.status(500).json({ error: 'Failed to fetch medical record' });
    }
}

/**
 * @swagger
 * /patients/{patientId}/records:
 *   get:
 *     summary: Get all medical records for a patient
 *     tags: [Medical Records]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: List of medical records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MedicalRecord'
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 */
export async function viewAllRecordsForAPatient(req: Request, res: Response): Promise<any> {
    try {
        const { patientId } = req.params;
        const id = Number(patientId);
        
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid patient ID' });
        }

        const records = await db.query.medicalRecords.findMany({
            where: eq(medicalRecords.patientId, id),
            with: {
                doctor: true
            },
            orderBy: (records, { desc }) => [desc(records.createdAt)]
        });

        res.json(records);
    } catch (error) {
        console.error('Error fetching patient records:', error);
        res.status(500).json({ error: 'Failed to fetch patient records' });
    }
}