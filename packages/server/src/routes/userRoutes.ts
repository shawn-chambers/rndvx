import { Router } from 'express';
import * as userController from '../controllers/userController';
import { validate, updateProfileSchema } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.get('/me', authenticate, userController.getProfile);
router.put('/me', authenticate, validate(updateProfileSchema), userController.updateProfile);

export default router;
