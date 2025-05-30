import { Router, RequestHandler } from 'express';
import { register, login, createDoctor, createAdmin, getUsers } from './authController';
import { validateRequest } from '../../middlewares/validationMiddleware';
import { registerSchema, loginSchema, createDoctorSchema, createAdminSchema } from './auth.schema';
import { authenticate, isAdmin } from '../../middlewares/authMiddleware';

const router = Router();

// Public routes
router.post('/register', validateRequest(registerSchema) as RequestHandler, register);
router.post('/login', validateRequest(loginSchema) as RequestHandler, login);
router.post('/create-admin', validateRequest(createAdminSchema) as RequestHandler, createAdmin);

// Protected routes
router.post('/doctors', authenticate as RequestHandler, isAdmin as RequestHandler, validateRequest(createDoctorSchema) as RequestHandler, createDoctor);
router.get('/users', authenticate as RequestHandler, isAdmin as RequestHandler, getUsers);

export default router;