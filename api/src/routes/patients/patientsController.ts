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
});

export async function getPatients(req: Request, res: Response): Promise<any> {

    const patients = await db.query.patients.findMany();
    res.send(patients);
};

export async function addPatient(req: Request, res: Response): Promise<any> {
    const { success, data, error } = patientSchema.safeParse(req.body);
    if (!success) {
        return res.status(400).json({ error: error.message });
    }
    const patient = await db.insert(patients).values(data);
    res.send(patient);
};

export async function updatePatient(req: Request, res: Response): Promise<any> {
    const { id } = req.params;
    const { success, data, error } = patientSchema.safeParse(req.body);
    if (!success) {
        return res.status(400).json({ error: error.message });
    }
    const patient = await db.update(patients).set(data).where(eq(patients.id, parseInt(id)));
    res.send(patient);
};

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


// Patient Management
// Endpoints:

// POST /patients – Register a new patient.

// GET /patients/:id – Retrieve patient profile.

// PUT /patients/:id – Update patient details.

// DELETE /patients/:id – Soft-delete or deactivate a patient.

// Data Fields:

// Full name, Date of birth, Gender, Contact info

// Patient ID (auto-generated)

// Insurance provider, insurance number

// Security:

// Basic authentication + authorization.