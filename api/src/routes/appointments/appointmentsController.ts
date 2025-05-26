import { Request, Response } from 'express';
import { db } from '../../db';
import { appointments, doctors, patients } from '../../db/schema';
import { eq, and, between, or, sql } from 'drizzle-orm';
import { z } from 'zod/v4';

// Validation schemas
const appointmentSchema = z.object({
    patientId: z.number().int().positive(),
    doctorId: z.number().int().positive(),
    appointmentDate: z.string().transform(str => new Date(str)),
    notes: z.string().optional(),
});

const statusSchema = z.enum(['scheduled', 'cancelled', 'completed']);

// Helper function to check if a time slot is available
async function isTimeSlotAvailable(doctorId: number, appointmentDate: Date): Promise<boolean> {
    // Check if doctor is available
    const doctor = await db.query.doctors.findFirst({
        where: eq(doctors.id, doctorId)
    });

    if (!doctor?.isAvailable) {
        return false;
    }

    // Check for overlapping appointments
    const startTime = new Date(appointmentDate);
    const endTime = new Date(appointmentDate.getTime() + 30 * 60000); // 30 minutes appointment

    const overlappingAppointments = await db.query.appointments.findMany({
        where: and(
            eq(appointments.doctorId, doctorId),
            eq(appointments.status, 'scheduled'),
            or(
                sql`${appointments.appointmentDate} BETWEEN ${startTime} AND ${endTime}`,
                sql`${new Date(appointmentDate.getTime() - 30 * 60000)} BETWEEN ${appointments.appointmentDate} AND ${endTime}`
            )
        )
    });

    return overlappingAppointments.length === 0;
}

export async function scheduleAppointment(req: Request, res: Response): Promise<any> {
    try {
        const validatedData = appointmentSchema.parse(req.body);
        
        // Validate patient exists
        const patient = await db.query.patients.findFirst({
            where: eq(patients.id, validatedData.patientId)
        });

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        // Validate doctor exists and is available
        const doctor = await db.query.doctors.findFirst({
            where: eq(doctors.id, validatedData.doctorId)
        });

        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        if (!doctor.isAvailable) {
            return res.status(400).json({ error: 'Doctor is not available for appointments' });
        }

        // Check if time slot is available
        const isAvailable = await isTimeSlotAvailable(
            validatedData.doctorId,
            validatedData.appointmentDate
        );

        if (!isAvailable) {
            return res.status(400).json({ error: 'Time slot is not available' });
        }

        // Create appointment
        const [newAppointment] = await db.insert(appointments)
            .values({
                ...validatedData,
                status: 'scheduled',
                createdAt: new Date(),
                updatedAt: new Date()
            })
            .returning();

        res.status(201).json(newAppointment);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                error: 'Validation error', 
                details: error.format() 
            });
        }
        
        console.error('Error scheduling appointment:', error);
        res.status(500).json({ error: 'Failed to schedule appointment' });
    }
}

export async function viewSchedule(req: Request, res: Response): Promise<any> {
    try {
        const { doctorId, date } = req.query;
        
        if (!doctorId || !date) {
            return res.status(400).json({ error: 'Doctor ID and date are required' });
        }

        const startDate = new Date(date as string);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        const schedule = await db.query.appointments.findMany({
            where: and(
                eq(appointments.doctorId, Number(doctorId)),
                sql`${appointments.appointmentDate} BETWEEN ${startDate} AND ${endDate}`
            ),
            with: {
                patient: true
            }
        });

        res.json(schedule);
    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).json({ error: 'Failed to fetch schedule' });
    }
}

export async function changeStatus(req: Request, res: Response): Promise<any> {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const appointmentId = Number(id);
        if (isNaN(appointmentId)) {
            return res.status(400).json({ error: 'Invalid appointment ID' });
        }

        const validatedStatus = statusSchema.parse(status);

        const [updatedAppointment] = await db.update(appointments)
            .set({
                status: validatedStatus,
                updatedAt: new Date()
            })
            .where(eq(appointments.id, appointmentId))
            .returning();

        if (!updatedAppointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        res.json(updatedAppointment);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                error: 'Validation error', 
                details: error.format() 
            });
        }
        
        console.error('Error updating appointment status:', error);
        res.status(500).json({ error: 'Failed to update appointment status' });
    }
}


// Appointment Scheduling
// Endpoints:

// POST /appointments – Schedule an appointment.

// GET /appointments?doctorId=...&date=... – View schedule.

// PUT /appointments/:id/status – Change status (booked, cancelled, completed).

// Logic:

// Prevent double-bookings (e.g., no overlapping appointments).

// Validate doctor's schedule availability.

// Models:

// Patient ↔ Appointment ↔ Doctor (many-to-many with details).