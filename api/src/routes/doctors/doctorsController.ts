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
});

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

export async function getDoctorById(req: Request, res: Response) {
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

export async function deleteDoctor(req: Request, res: Response) {
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
            message: 'Doctor deleted successfully',
            doctor: deletedDoctor
        });
    } catch (error) {
        console.error('Error deleting doctor:', error);
        res.status(500).json({ error: 'Failed to delete doctor' });
    }
}

// Doctor Management
// Endpoints:

// POST /doctors – Add a new doctor.

// GET /doctors/:id – View doctor profile.

// PUT /doctors/:id – Edit profile/schedule.

// Data Fields:

// Name, Specialty, Contact

// Schedule availability (e.g. Mon–Fri, 9 AM–5 PM)

// Availability Model:

// Store time blocks available for appointments.
