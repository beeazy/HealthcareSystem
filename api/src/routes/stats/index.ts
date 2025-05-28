import { Router, RequestHandler } from "express";
import { getTotalPatients, getTotalDoctors, getAppointmentsToday, getAvailableDoctors, getTopSpecializations, getAppointmentsByMonth } from "./statsController";
import { db } from "../../db";
import { users, doctorProfiles, appointments } from "../../db/schema";
import { eq, and, gte, lte, sql, count, desc } from "drizzle-orm";
import { authenticate } from '../../middlewares/authMiddleware';

const router = Router();

// Individual stat endpoints
router.get('/total-patients', authenticate as RequestHandler, getTotalPatients);
router.get('/total-doctors', authenticate as RequestHandler, getTotalDoctors);
router.get('/appointments-today', authenticate as RequestHandler, getAppointmentsToday);
router.get('/available-doctors', authenticate as RequestHandler, getAvailableDoctors);
router.get('/top-specializations', authenticate as RequestHandler, getTopSpecializations);
router.get('/appointments-by-month', authenticate as RequestHandler, getAppointmentsByMonth);

// Combined stats endpoint

/**
 * @swagger
 * /stats:
 *   get:
 *     tags:
 *       - Statistics
 *     summary: Get all statistics
 *     description: Retrieve all statistics
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalPatients:
 *                   type: number
 *                 totalDoctors:
 *                   type: number
 *                 appointmentsToday:
 *                   type: number
 *                 availableDoctors:
 *                   type: number
 *                 topSpecializations: 
 *                   type: array
 *                   items:
 *                     type: string
 *                 appointmentsByMonth:
 *                   type: object
 *                   properties:
 *                     months:
 *                       type: array
 *                       items:
 *                         type: string
 *                     counts:
 *                       type: array
 *                       items: 
 *                         type: number
 *       500:
 *         description: Server error
 */

router.get('/', (async (req, res) => {
    try {
        // Create a new response object for each stat
        const stats = {
            totalPatients: await db.select({ value: count() }).from(users).where(eq(users.role, 'patient')),
            totalDoctors: await db.select({ value: count() }).from(doctorProfiles).where(eq(doctorProfiles.isActive, true)),
            appointmentsToday: await db.select({ value: count() }).from(appointments)
                .where(and(
                    gte(appointments.appointmentDate, new Date(new Date().setHours(0, 0, 0, 0))),
                    lte(appointments.appointmentDate, new Date(new Date().setHours(23, 59, 59, 999)))
                )),
            availableDoctors: await db.select({ value: count() }).from(doctorProfiles)
                .where(eq(doctorProfiles.isActive, true)),
            topSpecializations: await db.select({
                specialization: doctorProfiles.specialization,
                count: count()
            })
            .from(doctorProfiles)
            .where(eq(doctorProfiles.isActive, true))
            .groupBy(doctorProfiles.specialization)
            .orderBy(desc(count()))
            .limit(5),
            appointmentsByMonth: await db.select({
                month: sql<string>`to_char(${appointments.appointmentDate}, 'Mon')`,
                count: count()
            })
            .from(appointments)
            .where(gte(appointments.appointmentDate, new Date(new Date().setMonth(new Date().getMonth() - 6))))
            .groupBy(sql`to_char(${appointments.appointmentDate}, 'Mon')`)
            .orderBy(sql`to_char(${appointments.appointmentDate}, 'Mon')`)
        };

        res.json({
            totalPatients: stats.totalPatients[0].value,
            totalDoctors: stats.totalDoctors[0].value,
            appointmentsToday: stats.appointmentsToday[0].value,
            availableDoctors: stats.availableDoctors[0].value,
            topSpecializations: stats.topSpecializations.map(s => s.specialization),
            appointmentsByMonth: {
                months: stats.appointmentsByMonth.map(a => a.month),
                counts: stats.appointmentsByMonth.map(a => Number(a.count))
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
}));

export default router;