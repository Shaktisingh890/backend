import Router from 'express';
import { registerCustomer,loginCustomer } from '../controllers/customer.controller.js';
import { multerUpload } from '../middlewares/multerService.js';


const router=Router()

router.post("/customerRegister",multerUpload.fields([
    {
        name: 'imgUrl', maxCount: 1 
    }
]),registerCustomer)



export default router;