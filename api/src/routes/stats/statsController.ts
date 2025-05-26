import { Request, Response } from "express";
import { db } from "../../db";
import { patients, doctors, appointments, medicalRecords } from "../../db/schema";
import { eq, and, gte, lte, sql, count, desc } from "drizzle-orm";

export async function getTotalPatients(req: Request, res: Response): Promise<void> {
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

export async function getTotalDoctors(req: Request, res: Response): Promise<void> {
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

export async function getAppointmentsToday(req: Request, res: Response): Promise<void> {
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

export async function getAvailableDoctors(req: Request, res: Response): Promise<void> {
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

export async function getTopSpecializations(req: Request, res: Response): Promise<void> {
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

export async function getAppointmentsByMonth(req: Request, res: Response): Promise<void> {
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