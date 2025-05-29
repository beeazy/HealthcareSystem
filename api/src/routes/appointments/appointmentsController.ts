import { Request, Response } from 'express';
import { db } from '../../db';
import { appointments, doctorProfiles, patientProfiles } from '../../db/schema';
import { eq, and, between, or, sql, gte, lte, asc, lt } from 'drizzle-orm';
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
    startTime: z.string()
        .transform(str => new Date(str))
        .refine(date => {
            const now = new Date();
            const hours = date.getHours();
            return date > now && hours >= 9 && hours < 17;
        }, {
            message: "Appointment must be in the future between 9 AM and 5 PM"
        }),
    notes: z.string().optional(),
    status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']).optional()
}).strict();

const updateAppointmentSchema = appointmentSchema.partial();

const statusSchema = z.enum(['scheduled', 'cancelled', 'completed']);

// Helper function to check if a time slot is available
async function isTimeSlotAvailable(doctorId: number, appointmentDate: Date): Promise<boolean> {
    const startTime = new Date(appointmentDate);
    const endTime = new Date(appointmentDate.getTime() + 30 * 60000); // 30 minutes appointment

    const overlappingAppointments = await db.query.appointments.findMany({
        where: and(
            eq(appointments.doctorId, doctorId),
            eq(appointments.status, 'scheduled'),
            sql`${appointments.startTime}::date = ${startTime}::date`,
            or(
                sql`${appointments.startTime}::time BETWEEN ${startTime}::time AND ${endTime}::time`,
                sql`${new Date(appointmentDate.getTime() - 30 * 60000)}::time BETWEEN ${appointments.startTime}::time AND ${endTime}::time`
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
        const { patientId, doctorId, startTime, notes } = appointmentSchema.parse(req.body);
        const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 minutes later
        
        // Check if slot is available
        const existingAppointment = await db.query.appointments.findFirst({
            where: and(
                eq(appointments.doctorId, doctorId),
                eq(appointments.status, 'scheduled'),
                or(
                    and(
                        gte(appointments.startTime, startTime),
                        lt(appointments.startTime, endTime)
                    ),
                    and(
                        gte(appointments.endTime, startTime),
                        lt(appointments.endTime, endTime)
                    )
                )
            )
        });

        if (existingAppointment) {
            return res.status(400).json({ error: 'Time slot is not available' });
        }

        // Check if doctor is active
        const doctor = await db.query.doctorProfiles.findFirst({
            where: and(
                eq(doctorProfiles.userId, doctorId),
                eq(doctorProfiles.isActive, true)
            )
        });

        if (!doctor) {
            return res.status(400).json({ error: 'Doctor is not available' });
        }

        // Create the appointment
        const appointment = await db.insert(appointments).values({
            patientId,
            doctorId,
            startTime,
            endTime,
            notes,
            status: 'scheduled'
        }).returning();

        return res.status(201).json(appointment[0]);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.format() });
        }
        console.error('Error scheduling appointment:', error);
        return res.status(500).json({ error: 'Internal server error' });
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
                sql`${appointments.startTime} BETWEEN ${startDate} AND ${endDate}`
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
        const userId = req.user?.userId
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
            
            orderBy: (appointments, { desc }) => [desc(appointments.startTime)],
        })

        res.json(patientAppointments)
    } catch (error) {
        console.error('Error fetching patient appointments:', error)
        res.status(500).json({ error: 'Failed to fetch patient appointments' })
    }
}

/**
 * @swagger
 * /appointments/slots:
 *   get:
 *     summary: Get available time slots for a doctor on a specific date
 *     tags: [Appointments]
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to check for available slots
 *       - in: query
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the doctor
 *     responses:
 *       200:
 *         description: Available time slots retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   time:
 *                     type: string
 *                     format: time
 *                   available:
 *                     type: boolean
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Server error
 */
export async function getAvailableSlots(req: Request, res: Response): Promise<any> {
    try {
        const { date, doctorId } = req.query;
        
        if (!date || !doctorId) {
            return res.status(400).json({ error: 'Date and doctor ID are required' });
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

        // Generate time slots from 9 AM to 5 PM
        const slots = [];
        const startHour = 9;
        const endHour = 17;
        const selectedDate = new Date(date as string);

        // Get existing appointments for the day
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existingAppointments = await db.query.appointments.findMany({
            where: and(
                eq(appointments.doctorId, Number(doctorId)),
                eq(appointments.status, 'scheduled'),
                sql`${appointments.startTime} BETWEEN ${startOfDay} AND ${endOfDay}`
            )
        });

        // Create a map of booked times
        const bookedTimes = new Set(
            existingAppointments.map(apt => {
                const aptDate = new Date(apt.startTime);
                return `${aptDate.getHours()}:${aptDate.getMinutes().toString().padStart(2, '0')}`;
            })
        );

        // Generate available slots (30-minute intervals)
        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeString = `${hour}:${minute.toString().padStart(2, '0')}`;
                const slotTime = new Date(selectedDate);
                slotTime.setHours(hour, minute, 0, 0);

                // Skip past times
                if (slotTime < new Date()) {
                    continue;
                }

                slots.push({
                    time: timeString,
                    available: !bookedTimes.has(timeString)
                });
            }
        }

        res.json(slots);
    } catch (error) {
        console.error('Error fetching available slots:', error);
        res.status(500).json({ error: 'Failed to fetch available slots' });
    }
}

export async function getAppointments(req: Request, res: Response): Promise<any> {
    try {
        const { doctorId, patientId, startDate, endDate } = req.query;
        
        const whereConditions = [];
        
        if (doctorId) {
            whereConditions.push(eq(appointments.doctorId, Number(doctorId)));
        }
        
        if (patientId) {
            whereConditions.push(eq(appointments.patientId, Number(patientId)));
        }
        
        if (startDate && endDate) {
            whereConditions.push(
                and(
                    gte(appointments.startTime, new Date(startDate as string)),
                    lte(appointments.startTime, new Date(endDate as string))
                )
            );
        }
        
        const appointmentsList = await db.query.appointments.findMany({
            where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
            orderBy: [asc(appointments.startTime)]
        });
        
        return res.json(appointmentsList);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * @swagger
 * /appointments/{id}:
 *   put:
 *     summary: Update an appointment
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
 *             $ref: '#/components/schemas/Appointment'
 *     responses:
 *       200:
 *         description: Appointment updated successfully
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
export async function updateAppointment(req: Request, res: Response): Promise<any> {
    try {
        const { id } = req.params;
        const updateData = updateAppointmentSchema.parse(req.body);
        
        const [updatedAppointment] = await db.update(appointments)
            .set({
                ...updateData,
                updatedAt: new Date()
            })
            .where(eq(appointments.id, Number(id)))
            .returning();
            
        if (!updatedAppointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        
        return res.json(updatedAppointment);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.format() });
        }
        console.error('Error updating appointment:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getAppointmentsByDate(req: Request, res: Response): Promise<any> {
    try {
        const { date } = req.params;
        const startDate = new Date(date);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        const appointmentsList = await db.query.appointments.findMany({
            where: and(
                gte(appointments.startTime, startDate),
                lt(appointments.startTime, endDate)
            ),
            orderBy: [asc(appointments.startTime)]
        });

        return res.json(appointmentsList);
    } catch (error) {
        console.error('Error fetching appointments by date:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getAppointmentsByDoctor(req: Request, res: Response): Promise<any> {
    try {
        const { doctorId } = req.params;
        const { startDate, endDate } = req.query;

        const whereConditions = [eq(appointments.doctorId, Number(doctorId))];

        const appointmentsList = await db.query.appointments.findMany({
            where: whereConditions.length > 0 ? and(...whereConditions) : eq(appointments.id, appointments.id),
            orderBy: [asc(appointments.startTime)]
        });

        return res.json(appointmentsList);
    } catch (error) {
        console.error('Error fetching doctor appointments:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getAppointmentsByPatient(req: Request, res: Response): Promise<any> {
    try {
        const { patientId } = req.params;
        const { startDate, endDate } = req.query;

        const whereConditions = [eq(appointments.patientId, Number(patientId))];

        const appointmentsList = await db.query.appointments.findMany({
            where: whereConditions.length > 0 ? and(...whereConditions) : eq(appointments.id, appointments.id),
            orderBy: [asc(appointments.startTime)]
        });

        return res.json(appointmentsList);
    } catch (error) {
        console.error('Error fetching patient appointments:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getDoctorAppointments(req: Request, res: Response): Promise<any> {
    try {
        const doctorId = req.user?.userId;
        if (!doctorId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { startDate, endDate } = req.query;

        const whereConditions = [eq(appointments.doctorId, doctorId)];

        const appointmentsList = await db.query.appointments.findMany({
            where: whereConditions.length > 0 ? and(...whereConditions) : eq(appointments.id, appointments.id),
            orderBy: [asc(appointments.startTime)]
        });

        return res.json(appointmentsList);
    } catch (error) {
        console.error('Error fetching doctor appointments:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
