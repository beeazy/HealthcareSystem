import { Router } from "express";
import { getDoctors, addDoctor, updateDoctor, getDoctorById, deactivateDoctor } from "./doctorsController";
import { authenticate, isAdmin } from "../../middlewares/authMiddleware";

const router = Router();

router.get('/', authenticate, isAdmin, getDoctors);

router.post('/', authenticate, isAdmin, addDoctor);

router.put('/:id', authenticate, isAdmin, updateDoctor);

router.get('/:id', authenticate, isAdmin, getDoctorById);

router.put('/:id/deactivate', authenticate, isAdmin, deactivateDoctor);

export default router;