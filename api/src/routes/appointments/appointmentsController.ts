import { Request, Response } from 'express';
import { db } from '../../db';
import { appointments, doctorProfiles, patientProfiles } from '../../db/schema';
import { eq, and, between, or, sql } from 'drizzle-orm';
import { z } from 'zod/v4';

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       required:
 *         - patientId
 *         - doctorId
 *         - appointmentDate
 *       properties:
 *         patientId:
 *           type: integer
 *           description: ID of the patient
 *         doctorId:
 *           type: integer
 *           description: ID of the doctor
 *         appointmentDate:
 *           type: string
 *           format: date-time
 *           description: Date and time of the appointment
 *         notes:
 *           type: string
 *           description: Additional notes for the appointment
 *         status:
 *           type: string
 *           enum: [scheduled, cancelled, completed]
 *           description: Current status of the appointment
 */

// Validation schemas
const appointmentSchema = z.object({
    patientId: z.number().int().positive(),
    doctorId: z.number().int().positive(),
    appointmentDate: z.string()
        .transform(str => new Date(str))
        .refine(date => date > new Date(), {
            message: "Appointment date must be in the future"
        })
        .refine(date => {
            const hours = date.getHours();
            const minutes = date.getMinutes();
            // Only allow appointments between 9 AM and 5 PM
            return (hours > 9 || (hours === 9 && minutes >= 0)) && 
                   (hours < 17 || (hours === 17 && minutes === 0));
        }, {
            message: "Appointments are only available between 9 AM and 5 PM"
        }),
    notes: z.string().optional(),
}).strict();

const statusSchema = z.enum(['scheduled', 'cancelled', 'completed']);

// Helper function to check if a time slot is available
async function isTimeSlotAvailable(doctorId: number, appointmentDate: Date): Promise<boolean> {
    // Check if doctor is active
    const doctor = await db.query.doctorProfiles.findFirst({
        where: eq(doctorProfiles.userId, doctorId)
    });

    if (!doctor?.isActive) {
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

/**
 * @swagger
 * /appointments:
 *   post:
 *     summary: Schedule a new appointment
 *     tags: [Appointments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appointment'
 *     responses:
 *       201:
 *         description: Appointment scheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Invalid request or time slot not available
 *       404:
 *         description: Patient or doctor not found
 *       500:
 *         description: Server error
 */
export async function scheduleAppointment(req: Request, res: Response): Promise<any> {
    try {
        const validatedData = appointmentSchema.parse(req.body);
        
        // Validate patient exists
        const patient = await db.query.patientProfiles.findFirst({
            where: eq(patientProfiles.userId, validatedData.patientId)
        });

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        // Validate doctor exists and is active
        const doctor = await db.query.doctorProfiles.findFirst({
            where: eq(doctorProfiles.userId, validatedData.doctorId)
        });

        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        if (!doctor.isActive) {
            return res.status(400).json({ error: 'Doctor is not active' });
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

/**
 * @swagger
 * /appointments:
 *   get:
 *     summary: View doctor's schedule for a specific date
 *     tags: [Appointments]
 *     parameters:
 *       - in: query
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the doctor
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to view schedule for
 *     responses:
 *       200:
 *         description: Schedule retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */
export async function viewSchedule(req: Request, res: Response): Promise<any> {
    try {
        const { doctorId, date } = req.query;
        
        if (!doctorId || !date) {
            return res.status(400).json({ error: 'Doctor ID and date are required' });
        }

        // Check if doctor exists and is active
        const doctor = await db.query.doctorProfiles.findFirst({
            where: eq(doctorProfiles.userId, Number(doctorId))
        });

        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        if (!doctor.isActive) {
            return res.status(400).json({ error: 'Doctor is not active' });
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

/**
 * @swagger
 * /appointments/{id}/status:
 *   put:
 *     summary: Update appointment status
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [scheduled, cancelled, completed]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Invalid request or status
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Server error
 */
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

    /**
 * @swagger
 * /appointments:
 *   get:
 *     summary: Get all appointments
 *     tags: [Appointments]
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appointment'
 *       500:
 *         description: Server error
 */
    export async function getAllAppointments(
      req: Request,
      res: Response
    ): Promise<any> {
      try {
        const appointments = await db.query.appointments.findMany();
        res.json(appointments);
      } catch (error) {
        console.error("Error fetching all appointments:", error);
        res.status(500).json({ error: "Failed to fetch all appointments" });
      }
    }

/**
 * @swagger
 * /appointments/patient:
 *   get:
 *     summary: Get all appointments for the authenticated patient
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of patient's appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appointment'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 */
export async function getPatientAppointments(req: Request, res: Response): Promise<any> {
    try {
        const userId = req.user?.id
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        // Find the patient profile for the authenticated user
        const patient = await db.query.patientProfiles.findFirst({
            where: eq(patientProfiles.userId, userId)
        })

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' })
        }

        // Get all appointments for the patient
        const patientAppointments = await db.query.appointments.findMany({
            where: eq(appointments.patientId, patient.id),
            with: {
                doctor: {
                    columns: {
                        id: true,
                        fullName: true,
                        specialization: true,
                    },
                },
            },
            orderBy: (appointments, { desc }) => [desc(appointments.appointmentDate)],
        })

        res.json(patientAppointments)
    } catch (error) {
        console.error('Error fetching patient appointments:', error)
        res.status(500).json({ error: 'Failed to fetch patient appointments' })
    }
}