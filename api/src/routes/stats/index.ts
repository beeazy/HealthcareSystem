import { Router } from "express";
import { getTotalPatients, getTotalDoctors, getAppointmentsToday, getAvailableDoctors, getTopSpecializations, getAppointmentsByMonth } from "./statsController";

const router = Router();

router.get('/total-patients', async (req, res) => {
    const result = await getTotalPatients(req, res);
    res.json(result);
});

router.get('/total-doctors', async (req, res) => {
    const result = await getTotalDoctors(req, res);
    res.json(result);
});

router.get('/appointments-today', async (req, res) => {
    const result = await getAppointmentsToday(req, res);
    res.json(result);
});

router.get('/available-doctors', async (req, res) => {
    const result = await getAvailableDoctors(req, res);
    res.json(result);
});

router.get('/top-specializations', async (req, res) => {
    const result = await getTopSpecializations(req, res);
    res.json(result);
});

router.get('/appointments-by-month', async (req, res) => {
    const result = await getAppointmentsByMonth(req, res);
    res.json(result);
});

router.get('/', async (req, res) => {
    try {
        const [
            totalPatients,
            totalDoctors,
            appointmentsToday,
            availableDoctors,
            topSpecializations,
            appointmentsByMonth
        ] = await Promise.all([
            getTotalPatients(req, res),
            getTotalDoctors(req, res),
            getAppointmentsToday(req, res),
            getAvailableDoctors(req, res),
            getTopSpecializations(req, res),
            getAppointmentsByMonth(req, res)
        ]);

        const stats = {
            totalPatients,
            totalDoctors,
            appointmentsToday,
            availableDoctors,
            topSpecializations,
            appointmentsByMonth
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

export default router;