import { Router } from 'express';
import { login, createUser, loginSchema, createUserSchema } from './authController';
import { validate } from '../../middlewares/validationMiddleware';
import { authenticate, isAdmin } from '../../middlewares/authMiddleware';
import { getUsers } from './authController';
const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/register', validate(createUserSchema), createUser);

router.get('/users', authenticate, isAdmin, getUsers);

export default router;