import { Router } from "express";
import { addMedicalRecord, viewSpecificMedicalRecord, viewAllRecordsForAPatient } from "./recordsController";
import { authenticate, isActiveDoctor } from "../../middlewares/authMiddleware";

const router = Router();

router.use(authenticate);

router.post('/', isActiveDoctor, addMedicalRecord);

router.get('/:id', isActiveDoctor, viewSpecificMedicalRecord);

router.get('/patients/:id/records', isActiveDoctor, viewAllRecordsForAPatient);

export default router;