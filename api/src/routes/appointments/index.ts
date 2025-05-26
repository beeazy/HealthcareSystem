import { Router } from "express";

const router = Router();

router.post('/', (req, res) => {
    res.send('Schedule Appointment');
});

router.get('/', (req, res) => {
    res.send('View Schedule');
});

router.put('/:id/status', (req, res) => {
    res.send('Change Status');
});

export default router;

