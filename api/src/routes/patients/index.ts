import { Router } from "express";
import { getPatients, addPatient, updatePatient, deletePatient } from "./patientsController";

const router = Router();

router.get('/', getPatients);

router.post('/', addPatient);

router.put('/:id', updatePatient);

router.delete('/:id', deletePatient);

export default router;