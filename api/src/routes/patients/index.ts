import { Router, RequestHandler } from "express";
import { 
    getPatients, 
    addPatient, 
    updatePatient, 
    deletePatient, 
    getPatient, 
    getPatientRecords,
    getPatientAppointments,
    createMedicalRecord 
} from "./patientsController";
import { authenticate, isAdmin, isActiveDoctor, isDoctorOrAdmin } from "../../middlewares/authMiddleware";

const router = Router();

// All routes require authentication
router.use(authenticate as RequestHandler);

// GET - Admins and active doctors can view patients
router.get('/', isDoctorOrAdmin as RequestHandler, getPatients);

// GET - Get single patient
router.get('/:id', isDoctorOrAdmin as RequestHandler, getPatient);

// GET - Get patient records
router.get('/:id/records', isDoctorOrAdmin as RequestHandler, getPatientRecords);

// GET - Get patient appointments
router.get('/:id/appointments', isDoctorOrAdmin as RequestHandler, getPatientAppointments);

// POST - Create medical record
router.post('/:id/records', isDoctorOrAdmin as RequestHandler, createMedicalRecord);

// POST - Only active doctors can add patients
router.post('/', isDoctorOrAdmin as RequestHandler, addPatient);

// PUT - Only active doctors can update patients
router.put('/:id', isDoctorOrAdmin as RequestHandler, updatePatient);

// DELETE - Only admins can delete patients
router.delete('/:id', isAdmin as RequestHandler, deletePatient);

export default router;