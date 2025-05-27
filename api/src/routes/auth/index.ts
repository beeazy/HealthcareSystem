import { Router } from 'express';
import { login, createUser, createAdmin, loginSchema, createUserSchema, createAdminSchema } from './authController';
import { validate } from '../../middlewares/validationMiddleware';
import { authenticate, isAdmin } from '../../middlewares/authMiddleware';
import { getUsers } from './authController';

const router = Router();

// Public routes
router.post('/login', validate(loginSchema), login);

// Admin creation route (protected by admin key)
router.post('/create-admin', validate(createAdminSchema), createAdmin);

// Protected routes
router.post('/register', authenticate, isAdmin, validate(createUserSchema), createUser);
router.get('/users', authenticate, isAdmin, getUsers);

export default router;