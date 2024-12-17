import {Router} from 'express';
import {Car} from '../models/car.js';
import { authMiddleware } from '../middlewares/authMiddleware.js'; 
import { multerUpload } from '../middlewares/multerService.js';
import { createBooking,getAllBooking, getBookingByCarId, updateBookingPaymentStatus} from '../controllers/booking.controller.js';

const router = Router();

router.post('/createBooking',createBooking)
router.get("/getAllBooking",getAllBooking)
router.get('/getBookingByCarId/:carId',authMiddleware,getBookingByCarId)
router.put(`/paymentstatus`,updateBookingPaymentStatus)

export default router;