import { Router, RequestHandler } from "express";
import { addMedicalRecord, viewSpecificMedicalRecord, viewAllRecordsForAPatient } from "./recordsController";
import { authenticate, isActiveDoctor } from "../../middlewares/authMiddleware";

const router = Router();

router.use(authenticate as RequestHandler);

router.post('/', isActiveDoctor as RequestHandler, addMedicalRecord);

router.get('/:id', isActiveDoctor as RequestHandler, viewSpecificMedicalRecord);

router.get('/patients/:id/records', isActiveDoctor as RequestHandler, viewAllRecordsForAPatient);

export default router;