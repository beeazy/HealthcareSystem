import { Router } from "express";
import { getDoctors, addDoctor, updateDoctor } from "./doctorsController";
import { authenticate, isAdmin } from "../../middlewares/authMiddleware";

const router = Router();

router.get('/', authenticate, isAdmin, getDoctors);

router.post('/', authenticate, isAdmin, addDoctor);

router.put('/:id', authenticate, isAdmin, updateDoctor);


export default router;