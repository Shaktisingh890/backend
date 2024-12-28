import Router from 'express';
import { registerCustomer,loginCustomer, uploadIdentification } from '../controllers/customer.controller.js';
import { multerUpload } from '../middlewares/multerService.js';
import { authMiddleware } from '../middlewares/authMiddleware.js'; 


const router=Router()

router.post("/customerRegister",multerUpload.fields([
    {
        name: 'imgUrl', maxCount: 1 
    }
]),registerCustomer)

router.put("/upload-id",authMiddleware,multerUpload.fields([
    {name: 'front_photo', maxCount: 1},
    {name: 'back_photo', maxCount:1},
    {name: 'type', maxCount: 1},
    {name: 'id_number', maxCount: 1}
]), uploadIdentification);

export default router;