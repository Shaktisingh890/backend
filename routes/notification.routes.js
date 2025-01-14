import {Router} from 'express';

import { authMiddleware } from '../middlewares/authMiddleware.js'; 
import { multerUpload } from '../middlewares/multerService.js';
import {createNotification,fetchPartnerBookingNotification,partner_delete_all_notification, deleteNotification}  from '../controllers/notification.controller.js';
import Notification from '../models/notification.js';




const router = Router();

router.post("/new_notification",authMiddleware,createNotification)
router.get("/get_partner_booking_notification",authMiddleware,fetchPartnerBookingNotification)
router.delete("/partner_all_notification",authMiddleware,partner_delete_all_notification)
router.delete("/delete/:id",authMiddleware,deleteNotification);


// router.delete('/deleteAll', async (req, res) => {
//     try {
//       await Notification.deleteMany({}); // Delete all data from the Booking collection
//       console.log("All Notification Delete Successfully")
//       res.status(200).json({ message: 'All Notification deleted successfully' });
//     } catch (err) {
//       console.error('Error deleting Notification:', err);
//       res.status(500).json({ message: 'Error deleting Notification' });
//     }
//   });



export default router;