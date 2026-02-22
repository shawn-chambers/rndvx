import { Router } from 'express';
import * as authController from '../controllers/authController';
import { validate, registerSchema, loginSchema } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.me);

export default router;
