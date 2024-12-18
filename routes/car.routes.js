import {Router} from 'express';
import {Car} from '../models/car.js';
import { authMiddleware } from '../middlewares/authMiddleware.js'; 
import { multerUpload } from '../middlewares/multerService.js';

import { addCar,deleteCar,getAllCars, getCarById,updateCarDetails, getCarByCost, getCarByUserId } from '../controllers/car.controller.js';



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
router.get('/getCarByCost',authMiddleware, getCarByCost);
router.get('/getCarByUserId',authMiddleware, getCarByUserId)

router.put('/updateCar/:carId',authMiddleware, updateCarDetails)
router.delete('/deletaCar/:carId', deleteCar)
// router.delete('/deleteAll', async (req, res) => {
//     try {
//       await Car.deleteMany({}); // Delete all data from the Car collection
//       console.log("All Cars Delete Successfully")
//       res.status(200).json({ message: 'All cars deleted successfully' });
//     } catch (err) {
//       console.error('Error deleting cars:', err);
//       res.status(500).json({ message: 'Error deleting cars' });
//     }
//   });


export default router;

