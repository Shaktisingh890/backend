// routes/userRoutes.js
import {Router} from 'express'; 
import { registerUser,loginUser,updateProfile,getUserProfile,uploadImage,logoutUser,refreshAccessToken } from '../controllers/user.controller.js'; 
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { mytest } from '../controllers/test.controller.js';


import { multerUpload } from '../middlewares/multerService.js';

const router = Router();  

// POST route for login
router.post('/login', loginUser);

// POST route for registration
router.post('/register',multerUpload.fields([
    { name: 'photo', maxCount: 1 }, // Handle image field (photo)
    { name: 'fullName', maxCount: 1 }, // Handle full name (not an image)
    { name: 'email', maxCount: 1 }, // Handle email (not an image)
    { name: 'mobile', maxCount: 1 }, // Handle mobile number (not an image)
    { name: 'password', maxCount: 1 }, // Handle password (not an image)
  ]), registerUser);

// Define the GET route to fetch the user profile
router.get('/profile',authMiddleware, getUserProfile);

// POST route for image upload
router.post('/uploadImage',authMiddleware,multerUpload.fields([
    { name: 'file', maxCount: 1 }, // Handle image field (photo)
    
  ]), uploadImage);  // Image upload route

router.post("/updateProfile",authMiddleware,multerUpload.fields([
 
    { name: 'fullName', maxCount: 1 }, // Handle full name (not an image)
    { name: 'email', maxCount: 1 }, // Handle email (not an image)
    { name: 'mobile', maxCount: 1 }, // Handle mobile number (not an image)
    { name: 'password', maxCount: 1 }, // Handle password (not an image)
  ]),updateProfile);


  router.post("/logout",authMiddleware,logoutUser);

  router.post("/refresh-token",refreshAccessToken);

  router.post("/test",mytest)

export default router;  
