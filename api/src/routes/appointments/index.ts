import { Router, RequestHandler } from "express";
import { scheduleAppointment, viewSchedule, changeStatus, getAllAppointments, getPatientAppointments, getAvailableSlots, getDoctorAppointments } from "./appointmentsController";
import { authenticate, isAdmin, isDoctor, isPatient } from "../../middlewares/authMiddleware";
const router = Router();

router.use(authenticate as RequestHandler);

router.post('/', isPatient as RequestHandler, scheduleAppointment as RequestHandler);

router.get('/patient', getPatientAppointments as RequestHandler);
router.get('/doctor', isDoctor as RequestHandler, getDoctorAppointments as RequestHandler);

router.get('/slots', getAvailableSlots as RequestHandler);

router.get('/schedule', viewSchedule as RequestHandler);
router.put('/:id/status', isDoctor as RequestHandler, changeStatus as RequestHandler);

router.get('/', getAllAppointments as RequestHandler);

export default router;

