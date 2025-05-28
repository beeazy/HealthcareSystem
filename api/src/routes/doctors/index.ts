import { RequestHandler, Router } from "express";
import { getDoctors, addDoctor, updateDoctor, getDoctorById, deactivateDoctor } from "./doctorsController";
import { authenticate, isAdmin } from "../../middlewares/authMiddleware";

const router = Router();

router.get('/', authenticate as RequestHandler, getDoctors);

router.post('/', authenticate as RequestHandler, isAdmin as RequestHandler , addDoctor);

router.put('/:id', authenticate as RequestHandler, isAdmin as RequestHandler, updateDoctor);

router.get('/:id', authenticate as RequestHandler, isAdmin as RequestHandler, getDoctorById);

router.put('/:id/deactivate', authenticate as RequestHandler, isAdmin as RequestHandler, deactivateDoctor);

export default router;