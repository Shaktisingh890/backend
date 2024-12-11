import {Router} from 'express';
import {Car} from '../models/car.js';
import { authMiddleware } from '../middlewares/authMiddleware.js'; 
import { multerUpload } from '../middlewares/multerService.js';
import { addCar,deleteCar,getAllCars,updateCarDetails } from '../controllers/car.controller.js';


const router = Router();


router.post('/addCar',authMiddleware,multerUpload.fields(
    [
        {
          name:"car1",
          maxCount:1
        },
        {
            name:"car2",
            maxCount:1
        }
    ]
),addCar)

router.get('/getAllCars',authMiddleware, getAllCars)
router.put('/updateCar/:carId',authMiddleware, updateCarDetails)
router.delete('/deletaCar/:carId', deleteCar)


export default router;

