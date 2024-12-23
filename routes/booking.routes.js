import {Router} from 'express';
import {Car} from '../models/car.js';
import { authMiddleware } from '../middlewares/authMiddleware.js'; 
import { multerUpload } from '../middlewares/multerService.js';
import { createBooking,getAllBooking, getBookingByCarId, getBookingByUserId, getBookingByDriverId, deleteBookingById, updateBookingPaymentStatus} from '../controllers/booking.controller.js';

const router = Router();

router.post('/createBooking',createBooking)
router.get("/getAllBooking",getAllBooking)
router.get('/getBookingByCarId/:carId',authMiddleware,getBookingByCarId)
router.get("/getBookingByuserId", authMiddleware, getBookingByUserId)
router.get("/getBookingBydriverId", authMiddleware, getBookingByDriverId)
router.delete("/delete/:driverId", deleteBookingById)
router.put(`/paymentstatus`,updateBookingPaymentStatus)

export default router;