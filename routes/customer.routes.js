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
    {name: 'image1', maxCount: 1},
    {name: 'image2', maxCount: 1},
]), uploadIdentification);

export default router;