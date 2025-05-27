import { Router } from "express";
import { scheduleAppointment, viewSchedule, changeStatus, getAllAppointments } from "./appointmentsController";
import { authenticate, isAdmin } from "../../middlewares/authMiddleware";

const router = Router();

router.use(authenticate);

router.post('/', isAdmin, scheduleAppointment);

router.get('/', isAdmin, viewSchedule);

router.put('/:id/status', isAdmin, changeStatus);

router.get('/', getAllAppointments);

export default router;

