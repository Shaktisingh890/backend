import {Router} from 'express';
import {Car} from '../models/car.js';
import { authMiddleware } from '../middlewares/authMiddleware.js'; 
import { multerUpload } from '../middlewares/multerService.js';
import { addCar } from '../controllers/car.controller.js';


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


export default router;

