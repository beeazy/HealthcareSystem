import { Request, Response } from "express";
import { db } from "../../db";
import { patients, doctors, appointments, medicalRecords } from "../../db/schema";
import { eq, and, gte, lte, sql, count, desc } from "drizzle-orm";

/**
 * @swagger
 * /stats/patients/total:
 *   get:
 *     tags:
 *       - Statistics
 *     summary: Get total number of patients
 *     description: Retrieve the total count of patients in the system
 *     responses:
 *       200:
 *         description: Total patient count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 *       500:
 *         description: Server error
 */
export async function getTotalPatients(req: Request, res: Response): Promise<any> {
    try {
        const [{ value }] = await db
            .select({ value: count() })
            .from(patients);
        
        res.json({ count: value });
    } catch (error) {
        console.error('Error fetching total patients:', error);
        res.status(500).json({ error: 'Failed to fetch total patients' });
    }
}

/**
 * @swagger
 * /stats/doctors/total:
 *   get:
 *     tags:
 *       - Statistics
 *     summary: Get total number of active doctors
 *     description: Retrieve the total count of active doctors in the system
 *     responses:
 *       200:
 *         description: Total doctor count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 *       500:
 *         description: Server error
 */
export async function getTotalDoctors(req: Request, res: Response): Promise<any> {
    try {
        const [{ value }] = await db
            .select({ value: count() })
            .from(doctors)
            .where(eq(doctors.isActive, true));
        
        res.json({ count: value });
    } catch (error) {
        console.error('Error fetching total doctors:', error);
        res.status(500).json({ error: 'Failed to fetch total doctors' });
    }
}

/**
 * @swagger
 * /stats/appointments/today:
 *   get:
 *     tags:
 *       - Statistics
 *     summary: Get today's appointments count
 *     description: Retrieve the count of appointments scheduled for today
 *     responses:
 *       200:
 *         description: Today's appointments count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 *       500:
 *         description: Server error
 */
export async function getAppointmentsToday(req: Request, res: Response): Promise<any> {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [{ value }] = await db
            .select({ value: count() })
            .from(appointments)
            .where(
                and(
                    gte(appointments.appointmentDate, today),
                    lte(appointments.appointmentDate, tomorrow)
                )
            );
        
        res.json({ count: value });
    } catch (error) {
        console.error('Error fetching today\'s appointments:', error);
        res.status(500).json({ error: 'Failed to fetch today\'s appointments' });
    }
}

/**
 * @swagger
 * /stats/doctors/available:
 *   get:
 *     tags:
 *       - Statistics
 *     summary: Get count of available doctors
 *     description: Retrieve the count of doctors who are both active and available
 *     responses:
 *       200:
 *         description: Available doctors count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 *       500:
 *         description: Server error
 */
export async function getAvailableDoctors(req: Request, res: Response): Promise<any> {
    try {
        const [{ value }] = await db
            .select({ value: count() })
            .from(doctors)
            .where(
                and(
                    eq(doctors.isActive, true),
                    eq(doctors.isAvailable, true)
                )
            );
        
        res.json({ count: value });
    } catch (error) {
        console.error('Error fetching available doctors:', error);
        res.status(500).json({ error: 'Failed to fetch available doctors' });
    }
}

/**
 * @swagger
 * /stats/specializations/top:
 *   get:
 *     tags:
 *       - Statistics
 *     summary: Get top 5 specializations
 *     description: Retrieve the top 5 most common doctor specializations
 *     responses:
 *       200:
 *         description: Top specializations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 specializations:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Server error
 */
export async function getTopSpecializations(req: Request, res: Response): Promise<any> {
    try {
        const specializations = await db
            .select({
                specialization: doctors.specialization,
                count: count()
            })
            .from(doctors)
            .where(eq(doctors.isActive, true))
            .groupBy(doctors.specialization)
            .orderBy(desc(count()))
            .limit(5);

        res.json({ 
            specializations: specializations.map(s => s.specialization)
        });
    } catch (error) {
        console.error('Error fetching top specializations:', error);
        res.status(500).json({ error: 'Failed to fetch top specializations' });
    }
}

/**
 * @swagger
 * /stats/appointments/monthly:
 *   get:
 *     tags:
 *       - Statistics
 *     summary: Get appointments by month
 *     description: Retrieve appointment counts for the last 6 months
 *     responses:
 *       200:
 *         description: Monthly appointments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 months:
 *                   type: array
 *                   items:
 *                     type: string
 *                 counts:
 *                   type: array
 *                   items:
 *                     type: number
 *       500:
 *         description: Server error
 */
export async function getAppointmentsByMonth(req: Request, res: Response): Promise<any> {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const appointmentsByMonth = await db
            .select({
                month: sql<string>`to_char(${appointments.appointmentDate}, 'Mon')`,
                count: count()
            })
            .from(appointments)
            .where(gte(appointments.appointmentDate, sixMonthsAgo))
            .groupBy(sql`to_char(${appointments.appointmentDate}, 'Mon')`)
            .orderBy(sql`to_char(${appointments.appointmentDate}, 'Mon')`);

        res.json({
            months: appointmentsByMonth.map(a => a.month),
            counts: appointmentsByMonth.map(a => Number(a.count))
        });
    } catch (error) {
        console.error('Error fetching appointments by month:', error);
        res.status(500).json({ error: 'Failed to fetch appointments by month' });
    }
}