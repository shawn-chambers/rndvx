import { Router } from 'express';
import * as inviteController from '../controllers/inviteController';
import { validate, createInviteSchema, respondInviteSchema } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', inviteController.listInvites);
router.get('/token/:token', inviteController.getInviteByToken);
router.post('/', validate(createInviteSchema), inviteController.createInvite);
router.put('/token/:token/respond', validate(respondInviteSchema), inviteController.respondToInvite);
router.delete('/:id', inviteController.deleteInvite);

export default router;
