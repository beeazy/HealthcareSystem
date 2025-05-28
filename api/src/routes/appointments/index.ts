import { Router, RequestHandler } from "express";
import { scheduleAppointment, viewSchedule, changeStatus, getAllAppointments, getPatientAppointments } from "./appointmentsController";
import { authenticate, isAdmin, isPatient } from "../../middlewares/authMiddleware";
const router = Router();

router.use(authenticate as RequestHandler);

router.post('/', isPatient as RequestHandler, scheduleAppointment as RequestHandler);

router.get('/patient', authenticate as RequestHandler, getPatientAppointments as RequestHandler);


router.get('/schedule', isAdmin as RequestHandler, viewSchedule as RequestHandler);
router.put('/:id/status', isAdmin as RequestHandler, changeStatus as RequestHandler);

router.get('/', getAllAppointments as RequestHandler);

export default router;

