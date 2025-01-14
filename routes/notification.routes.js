import {Router} from 'express';

import { authMiddleware } from '../middlewares/authMiddleware.js'; 
import { multerUpload } from '../middlewares/multerService.js';
import {createNotification,fetchPartnerBookingNotification,partner_delete_all_notification}  from '../controllers/notification.controller.js';





const router = Router();

router.post("/new_notification",authMiddleware,createNotification)
router.get("/get_partner_booking_notification",authMiddleware,fetchPartnerBookingNotification)
router.delete("/partner_all_notification",authMiddleware,partner_delete_all_notification)





export default router;