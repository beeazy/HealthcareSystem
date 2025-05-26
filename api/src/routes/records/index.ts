import { Router } from "express";
import { addMedicalRecord, viewSpecificMedicalRecord, viewAllRecordsForAPatient } from "./recordsController";

const router = Router();

router.post('/', addMedicalRecord);

router.get('/:id', viewSpecificMedicalRecord);

router.get('/patients/:id/records', viewAllRecordsForAPatient);

export default router;