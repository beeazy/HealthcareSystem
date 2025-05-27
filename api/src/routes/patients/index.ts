import { Router } from "express";
import { getPatients, addPatient, updatePatient, deletePatient } from "./patientsController";
import { authenticate, isAdmin, isActiveDoctor } from "../../middlewares/authMiddleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET - Admins and active doctors can view patients
router.get('/', isActiveDoctor, getPatients);

// POST - Only active doctors can add patients
router.post('/', isActiveDoctor, addPatient);

// PUT - Only active doctors can update patients
router.put('/:id', isActiveDoctor, updatePatient);

// DELETE - Only admins can delete patients
router.delete('/:id', isAdmin, deletePatient);

export default router;