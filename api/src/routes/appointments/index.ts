import { Router } from "express";
import { scheduleAppointment, viewSchedule, changeStatus } from "./appointmentsController";

const router = Router();

router.post('/', scheduleAppointment);

router.get('/', viewSchedule);

router.put('/:id/status', changeStatus);

export default router;

