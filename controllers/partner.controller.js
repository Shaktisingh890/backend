import { Partner } from "../models/partner.js";
import cloudinary from "../config/cloudinary.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import User from '../models/user.js'
import bcrypt from 'bcrypt';

const generateAccessAndRefereshTokens=async (userId)=>{
    try{
      const partner = await Partner.findById(userId);
      const refreshToken= partner.generateRefreshToken();
      const accessToken=partner.generateAccessToken();
      partner.refreshToken=refreshToken;
      await partner.save({validateBeforeSave:false});
      return {refreshToken,accessToken}
    }catch(error){
      // /console.log(error.message)
      throw new ApiError(500, error.message||"Something went wrong while generating referesh and access token")
    }
    
  }

  

const registerPartner = async (req,res,next)=>{

    const {fullName,email,phoneNumber,password,address}=req.body;
    
    if(!fullName || !email || !phoneNumber || !password){
        throw new ApiError(401,"All Field are Required");

    }
    let imgUrl=null;
    try{
   
      // Check if the email or phone number already exists in both Customer and User schemas
    const [existingPartner, existingUser] = await Promise.all([
      Partner.findOne({ $or: [{ email }, { phoneNumber }] }),
      User.findOne({ $or: [{ email }] }),
    ]);

    if (existingPartner|| existingUser) {
      throw new ApiError(409, "Email or phone number already registered");
    }


   
    if(req.files && req.files.imgUrl){
        const localPath=req.files.imgUrl[0].path;
        console.log("localPath",localPath);
     
         const cloudinaryResponse = await cloudinary.uploader.upload(localPath, {
             folder: 'partner_photos', // Optional: specify a folder in Cloudinary
             public_id: `${email}`,  // Optionally specify a public ID
           });
     
         imgUrl = cloudinaryResponse.secure_url;
     
     
        }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newPartner= await Partner.create(
        {
            fullName,
            email,
            phoneNumber,
            password : hashedPassword,
            address,
            imgUrl
        }
    ) 

      const newUser= User({
        email,
      password,
      role: 'partner',
      linkedId: newPartner._id
      })

      const user= await newUser.save()

      if(!user){
        throw new ApiError(400,"Partner Registration Failed")
      }

    
    
    return res.status(201).json(
        new ApiResponse(200,{fullName,email,phoneNumber,address,imgUrl},"Partner Register Successfully")
    )
   



    }catch(error){
console.log(error)
next(error.message || "error in Registering Partner");
    }

}


// POST: Login a Partner
const loginPartner = async (req, res,next) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
     
      throw new ApiError(400, "Email and password are required.");
    }
  
    try {
      const partner = await Partner.findOne({ email });
  
      if (!partner) {
        throw new ApiError(401,'Partner does not exist.')
      }
     const isPasswordValid=await partner.isPasswordCorrect(password);
      // Compare the plain text password directly (no hashing)
      if(!isPasswordValid){
      
        throw new ApiError(401,'Invalid Partner credentials.')
      }
  
      const {accessToken,refreshToken}= await generateAccessAndRefereshTokens(partner._id);
      const loggedInPartner=await Partner.findById(partner._id).select("-password -refreshToken");
  
      const options={
        httpOnly:true,
        secure:true,
        sameSite: 'None'
      }
  
  
  
      console.log("access token",accessToken)
      console.log("refresh token",refreshToken)
      console.log(req.Partner);
     
      return res.status(201)
      .cookie("accessToken",accessToken,options)
      .cookie("refersToken",refreshToken,options)
      .json( new ApiResponse(
        200, 
        {
          Partner: loggedInPartner, accessToken, refreshToken
      },
        "Partner logged In Successfully"
    ))
    } catch (err) {
      // console.error('Error during login attempt:', err);
      // return res.status(500).json(
      //   new ApiResponse(500, null, `Error Login Partner`)
      // );
      next(err)
    }
  };
  

export {registerPartner,loginPartner}