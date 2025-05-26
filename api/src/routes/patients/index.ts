import { Router } from "express";
import type { RequestHandler } from "express";
import { getPatients, addPatient, updatePatient, deletePatient } from "./patientsController";

const router = Router();

router.get('/', getPatients);

router.post('/', addPatient);

router.put('/:id', updatePatient);

router.delete('/:id', deletePatient as RequestHandler);

export default router;