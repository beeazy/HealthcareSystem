import { Router, RequestHandler } from "express";
import { getPatients, addPatient, updatePatient, deletePatient } from "./patientsController";
import { authenticate, isAdmin, isActiveDoctor } from "../../middlewares/authMiddleware";

const router = Router();

// All routes require authentication
router.use(authenticate as RequestHandler);

// GET - Admins and active doctors can view patients
router.get('/', isActiveDoctor as RequestHandler, getPatients);

// POST - Only active doctors can add patients
router.post('/', isActiveDoctor as RequestHandler, addPatient);

// PUT - Only active doctors can update patients
router.put('/:id', isActiveDoctor as RequestHandler, updatePatient);

// DELETE - Only admins can delete patients
router.delete('/:id', isAdmin as RequestHandler, deletePatient);

export default router;