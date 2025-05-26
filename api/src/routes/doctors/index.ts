import { Router } from "express";
import { getDoctors, addDoctor, updateDoctor } from "./doctorsController";

const router = Router();

router.get('/', getDoctors);

router.post('/', addDoctor);

router.put('/:id', updateDoctor);


export default router;