import { Router } from 'express';
import * as groupController from '../controllers/groupController';
import { validate, createGroupSchema, updateGroupSchema, addGroupMemberSchema, updateGroupMemberRoleSchema } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', groupController.listGroups);
router.get('/:id', groupController.getGroup);
router.post('/', validate(createGroupSchema), groupController.createGroup);
router.put('/:id', validate(updateGroupSchema), groupController.updateGroup);
router.delete('/:id', groupController.deleteGroup);

// Member management
router.post('/:id/members', validate(addGroupMemberSchema), groupController.addMember);
router.put('/:id/members/:memberId', validate(updateGroupMemberRoleSchema), groupController.updateMemberRole);
router.delete('/:id/members/:memberId', groupController.removeMember);

export default router;
