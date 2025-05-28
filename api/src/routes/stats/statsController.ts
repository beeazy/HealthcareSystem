import { Request, Response } from "express";
import { db } from "../../db";
import { users, doctorProfiles, patientProfiles, appointments, medicalRecords } from "../../db/schema";
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
            .from(users)
            .where(eq(users.role, 'patient'));
        
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
            .from(users)
            .where(
                and(
                    eq(users.role, 'doctor'),
                    eq(doctorProfiles.isActive, true)
                )
            );
        
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
            .from(users)
            .where(
                and(
                    eq(users.role, 'doctor'),
                    eq(doctorProfiles.isActive, true)
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
                specialization: doctorProfiles.specialization,
                count: count()
            })
            .from(users)
            .innerJoin(doctorProfiles, eq(users.id, doctorProfiles.userId))
            .where(
                and(
                    eq(users.role, 'doctor'),
                    eq(doctorProfiles.isActive, true)
                )
            )
            .groupBy(doctorProfiles.specialization)
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

/**
 * @swagger
 * /stats/patients/insurance:
 *   get:
 *     tags:
 *       - Statistics
 *     summary: Get insurance coverage statistics
 *     description: Get breakdown of patients by insurance provider (NHIF, Private, Self-pay)
 */
export async function getInsuranceStats(req: Request, res: Response): Promise<any> {
    try {
        const insuranceStats = await db
            .select({
                provider: patientProfiles.insuranceProvider,
                count: count()
            })
            .from(users)
            .innerJoin(patientProfiles, eq(users.id, patientProfiles.userId))
            .where(eq(users.role, 'patient'))
            .groupBy(patientProfiles.insuranceProvider);

        res.json({
            insuranceBreakdown: insuranceStats.map(stat => ({
                provider: stat.provider || 'Self-pay',
                count: Number(stat.count)
            }))
        });
    } catch (error) {
        console.error('Error fetching insurance stats:', error);
        res.status(500).json({ error: 'Failed to fetch insurance statistics' });
    }
}

/**
 * @swagger
 * /stats/appointments/peak-hours:
 *   get:
 *     tags:
 *       - Statistics
 *     summary: Get peak appointment hours
 *     description: Get appointment distribution by hour of day
 */
export async function getPeakHours(req: Request, res: Response): Promise<any> {
    try {
        const peakHours = await db
            .select({
                hour: sql<number>`EXTRACT(HOUR FROM ${appointments.appointmentDate})`,
                count: count()
            })
            .from(appointments)
            .where(
                and(
                    gte(appointments.appointmentDate, sql`CURRENT_DATE - INTERVAL '30 days'`),
                    eq(appointments.status, 'scheduled')
                )
            )
            .groupBy(sql`EXTRACT(HOUR FROM ${appointments.appointmentDate})`)
            .orderBy(sql`EXTRACT(HOUR FROM ${appointments.appointmentDate})`);

        res.json({
            peakHours: peakHours.map(hour => ({
                hour: Number(hour.hour),
                count: Number(hour.count)
            }))
        });
    } catch (error) {
        console.error('Error fetching peak hours:', error);
        res.status(500).json({ error: 'Failed to fetch peak hours' });
    }
}

/**
 * @swagger
 * /stats/doctors/workload:
 *   get:
 *     tags:
 *       - Statistics
 *     summary: Get doctor workload
 *     description: Get number of appointments per doctor for the last 30 days
 */
export async function getDoctorWorkload(req: Request, res: Response): Promise<any> {
    try {
        const workload = await db
            .select({
                doctorName: users.fullName,
                specialization: doctorProfiles.specialization,
                appointmentCount: count()
            })
            .from(appointments)
            .innerJoin(users, eq(appointments.doctorId, users.id))
            .innerJoin(doctorProfiles, eq(users.id, doctorProfiles.userId))
            .where(
                and(
                    gte(appointments.appointmentDate, sql`CURRENT_DATE - INTERVAL '30 days'`),
                    eq(appointments.status, 'scheduled')
                )
            )
            .groupBy(users.fullName, doctorProfiles.specialization)
            .orderBy(desc(count()));

        res.json({
            workload: workload.map(w => ({
                doctorName: w.doctorName,
                specialization: w.specialization,
                appointmentCount: Number(w.appointmentCount)
            }))
        });
    } catch (error) {
        console.error('Error fetching doctor workload:', error);
        res.status(500).json({ error: 'Failed to fetch doctor workload' });
    }
}

/**
 * @swagger
 * /stats/patients/age-groups:
 *   get:
 *     tags:
 *       - Statistics
 *     summary: Get patient age distribution
 *     description: Get breakdown of patients by age groups
 */
export async function getAgeGroups(req: Request, res: Response): Promise<any> {
    try {
        const ageGroups = await db
            .select({
                ageGroup: sql<string>`
                    CASE 
                        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, ${patientProfiles.dateOfBirth}::date)) < 18 THEN 'Under 18'
                        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, ${patientProfiles.dateOfBirth}::date)) < 30 THEN '18-29'
                        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, ${patientProfiles.dateOfBirth}::date)) < 45 THEN '30-44'
                        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, ${patientProfiles.dateOfBirth}::date)) < 60 THEN '45-59'
                        ELSE '60+'
                    END
                `,
                count: count()
            })
            .from(users)
            .innerJoin(patientProfiles, eq(users.id, patientProfiles.userId))
            .where(eq(users.role, 'patient'))
            .groupBy(sql`ageGroup`)
            .orderBy(sql`ageGroup`);

        res.json({
            ageGroups: ageGroups.map(group => ({
                ageGroup: group.ageGroup,
                count: Number(group.count)
            }))
        });
    } catch (error) {
        console.error('Error fetching age groups:', error);
        res.status(500).json({ error: 'Failed to fetch age groups' });
    }
}