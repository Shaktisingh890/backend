import {Router} from 'express';
import {Car} from '../models/car.js';
import { authMiddleware } from '../middlewares/authMiddleware.js'; 
import { multerUpload } from '../middlewares/multerService.js';

import { addCar,deleteCar,getAllCars, getCarById,updateCarDetails, getCarByUserId } from '../controllers/car.controller.js';



const router = Router();


router.post('/addCar',authMiddleware,multerUpload.fields(
    [
        { name: 'image0', maxCount: 1 },
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
    ]
),addCar)

router.get('/getAllCars', getAllCars)
router.get('/getCarByid/:carId', getCarById)

router.get('/getCarByUserId',authMiddleware, getCarByUserId)

router.put('/updateCar/:carId',authMiddleware, updateCarDetails)
router.delete('/deletaCar/:carId', deleteCar)


export default router;

