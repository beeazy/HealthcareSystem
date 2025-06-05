import { Router, RequestHandler } from "express";
import { 
    getPatients, 
    addPatient, 
    updatePatient, 
    deletePatient, 
    getPatient, 
    getPatientRecords,
    getPatientAppointments,
    createMedicalRecord, 
    searchPatients
} from "./patientsController";
import { authenticate, isAdmin, isDoctorOrAdmin } from "../../middlewares/authMiddleware";

const router = Router();

router.use(authenticate as RequestHandler);

router.get('/', isDoctorOrAdmin as RequestHandler, getPatients);

router.get('/:id', isDoctorOrAdmin as RequestHandler, getPatient);

router.get('/:id/records', isDoctorOrAdmin as RequestHandler, getPatientRecords);

router.get('/:id/appointments', isDoctorOrAdmin as RequestHandler, getPatientAppointments);

router.post('/:id/records', isDoctorOrAdmin as RequestHandler, createMedicalRecord);

router.post('/', isDoctorOrAdmin as RequestHandler, addPatient);

router.put('/:id', isDoctorOrAdmin as RequestHandler, updatePatient);

router.delete('/:id', isAdmin as RequestHandler, deletePatient);

// search for patients using phone number or email or insurance number as query

router.post('/search', isDoctorOrAdmin as RequestHandler, searchPatients);

export default router;