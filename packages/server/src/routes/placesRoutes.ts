import { Router } from 'express';
import * as placesController from '../controllers/placesController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/search', placesController.searchPlaces);
router.get('/meetings/:meetingId/auto-pick', placesController.autoPickLocation);
router.get('/:placeId', placesController.getPlaceDetails);

export default router;
