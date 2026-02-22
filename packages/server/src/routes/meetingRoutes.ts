import { Router } from 'express';
import * as meetingController from '../controllers/meetingController';
import {
  validate,
  createMeetingSchema,
  updateMeetingSchema,
  rsvpSchema,
} from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// All meeting routes require authentication
router.use(authenticate);

router.get('/', meetingController.listMeetings);
router.get('/:id', meetingController.getMeeting);
router.post('/', validate(createMeetingSchema), meetingController.createMeeting);
router.put('/:id', validate(updateMeetingSchema), meetingController.updateMeeting);
router.delete('/:id', meetingController.deleteMeeting);

// RSVP sub-routes
router.get('/:id/rsvps', meetingController.getRsvps);
router.put('/:id/rsvps', validate(rsvpSchema), meetingController.upsertRsvp);
router.delete('/:id/rsvps', meetingController.deleteRsvp);

export default router;
