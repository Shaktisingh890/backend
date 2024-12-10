import Router from "express";
import { multerUpload } from "../middlewares/multerService.js";
import { registerPartner,loginPartner } from "../controllers/partner.controller.js";


const router=Router();

router.post("/registerPartner",multerUpload.fields([
    {
        name:"imgUrl",
        maxCount:2
    }
]),registerPartner)



export default router;