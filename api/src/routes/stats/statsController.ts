import { Request, Response } from "express";
import { db } from "../../db";
import { users, doctorProfiles, patientProfiles, appointments, medicalRecords } from "../../db/schema";
import { eq, and, gte, lte, sql, count, desc } from "drizzle-orm";

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
                    gte(appointments.startTime, today),
                    lte(appointments.startTime, tomorrow)
                )
            );
        
        res.json({ count: value });
    } catch (error) {
        console.error('Error fetching today\'s appointments:', error);
        res.status(500).json({ error: 'Failed to fetch today\'s appointments' });
    }
}

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

export async function getAppointmentsByMonth(req: Request, res: Response): Promise<any> {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const appointmentsByMonth = await db
            .select({
                month: sql<string>`to_char(${appointments.startTime}, 'Mon')`,
                count: count()
            })
            .from(appointments)
            .where(gte(appointments.startTime, sixMonthsAgo))
            .groupBy(sql`to_char(${appointments.startTime}, 'Mon')`)
            .orderBy(sql`to_char(${appointments.startTime}, 'Mon')`);

        res.json({
            months: appointmentsByMonth.map(a => a.month),
            counts: appointmentsByMonth.map(a => Number(a.count))
        });
    } catch (error) {
        console.error('Error fetching appointments by month:', error);
        res.status(500).json({ error: 'Failed to fetch appointments by month' });
    }
}