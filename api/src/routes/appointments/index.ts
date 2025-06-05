import { Router, RequestHandler } from "express";
import { scheduleAppointment, viewSchedule, changeStatus, getAllAppointments, getPatientAppointments, getAvailableSlots, getDoctorAppointments } from "./appointmentsController";
import { authenticate } from "../../middlewares/authMiddleware";
const router = Router();

router.use(authenticate as RequestHandler);

router.post('/', scheduleAppointment as RequestHandler);

router.get('/patient', getPatientAppointments as RequestHandler);
router.get('/doctor', getDoctorAppointments as RequestHandler);

router.get('/slots', getAvailableSlots as RequestHandler);

router.get('/schedule', viewSchedule as RequestHandler);
router.put('/:id/status', changeStatus as RequestHandler);

router.get('/', getAllAppointments as RequestHandler);

export default router;

