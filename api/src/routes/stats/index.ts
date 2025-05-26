import { Router, RequestHandler } from "express";
import { getTotalPatients, getTotalDoctors, getAppointmentsToday, getAvailableDoctors, getTopSpecializations, getAppointmentsByMonth } from "./statsController";
import { db } from "../../db";
import { patients, doctors, appointments } from "../../db/schema";
import { eq, and, gte, lte, sql, count, desc } from "drizzle-orm";

const router = Router();

// Individual stat endpoints
router.get('/total-patients', getTotalPatients as RequestHandler);
router.get('/total-doctors', getTotalDoctors as RequestHandler);
router.get('/appointments-today', getAppointmentsToday as RequestHandler);
router.get('/available-doctors', getAvailableDoctors as RequestHandler);
router.get('/top-specializations', getTopSpecializations as RequestHandler);
router.get('/appointments-by-month', getAppointmentsByMonth as RequestHandler);

// Combined stats endpoint
router.get('/', (async (req, res) => {
    try {
        // Create a new response object for each stat
        const stats = {
            totalPatients: await db.select({ value: count() }).from(patients),
            totalDoctors: await db.select({ value: count() }).from(doctors).where(eq(doctors.isActive, true)),
            appointmentsToday: await db.select({ value: count() }).from(appointments)
                .where(and(
                    gte(appointments.appointmentDate, new Date(new Date().setHours(0, 0, 0, 0))),
                    lte(appointments.appointmentDate, new Date(new Date().setHours(23, 59, 59, 999)))
                )),
            availableDoctors: await db.select({ value: count() }).from(doctors)
                .where(and(
                    eq(doctors.isActive, true),
                    eq(doctors.isAvailable, true)
                )),
            topSpecializations: await db.select({
                specialization: doctors.specialization,
                count: count()
            })
            .from(doctors)
            .where(eq(doctors.isActive, true))
            .groupBy(doctors.specialization)
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