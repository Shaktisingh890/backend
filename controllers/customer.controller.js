import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import fs from "fs";
import jwt from 'jsonwebtoken';
import cloudinary from '../config/cloudinary.js';
import { Customer } from "../models/customer.js";
import { cursorTo } from "readline";
import User from "../models/user.js";
import { ObjectId } from "mongodb";


const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const customer = await Customer.findById(userId);
    const refreshToken = customer.generateRefreshToken();
    const accessToken = customer.generateAccessToken();
    customer.refreshToken = refreshToken;
    await customer.save({ validateBeforeSave: false });
    return { refreshToken, accessToken }
  } catch (error) {
    // /console.log(error.message)
    throw new ApiError(500, error.message || "Something went wrong while generating referesh and access token")
  }

}

const registerCustomer = async (req, res) => {
  const { fullName, email, phoneNumber, password } = req.body;

  // Validate the incoming data
  if (!fullName || !email || !phoneNumber || !password) {
    throw new ApiError(400, "All fields are required");
  }

  try {
    let imgUrl = null;
    let address = null;

    // Handle Cloudinary upload if a file (photo) is uploaded
    if (req.files && req.files.imgUrl) {
      const localPath = req.files.imgUrl[0].path;
      const cloudinaryResponse = await cloudinary.uploader.upload(localPath, {
        folder: 'user_photos', // Optional: specify a folder in Cloudinary
        public_id: `${email}`, // Optionally specify a public ID
      });

      imgUrl = cloudinaryResponse.secure_url;
    }

    // Check if the email or phone number already exists in both Customer and User schemas
    const [existingCustomer, existingUser] = await Promise.all([
      Customer.findOne({ $or: [{ email }, { phoneNumber }] }),
      User.findOne({ $or: [{ email }] }),
    ]);

    if (existingCustomer || existingUser) {
      throw new ApiError(409, "Email or phone number already registered");
    }

    // Create a new customer instance
    const newCustomer = new Customer({
      fullName,
      email,
      phoneNumber,
      password, // Store the password as plain text
      address,
      imgUrl, // Save the photo URL to the user
    });

    const savedCustomer = await newCustomer.save();

    // Create a user entry linked to the customer
    const user = new User({
      email,
      password,
      role: 'customer',
      linkedId: savedCustomer._id,
    });

    const savedUser = await user.save();

    // Return success response
    return res.status(201).json(
      new ApiResponse(
        200,
        {
          fullName: newCustomer.fullName,
          email: newCustomer.email,
          phoneNumber: newCustomer.phoneNumber,
          address: newCustomer.address,
          imgUrl: newCustomer.imgUrl,
        },
        "User registered successfully"
      )
    );
  } catch (error) {
    console.error(error);

    // Return error response
    return res.status(500).json(
      new ApiResponse(500, null, `Error registering user: ${error.message}`)
    );
  }
};



const loginCustomer = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {

    throw new ApiError(400, "Email and password are required.");
  }

  try {
    const customer = await Customer.findOne({ email });

    if (!customer) {
      throw new ApiError(401, 'Customer does not exist.')
    }
    const isPasswordValid = await customer.isPasswordCorrect(password);
    // Compare the plain text password directly (no hashing)
    if (!isPasswordValid) {

      throw new ApiError(401, 'Invalid Customer credentials.')
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(customer._id);
    const loggedInCustomer = await Customer.findById(customer._id).select("-password -refreshToken");

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: 'None'
    }



    console.log("access token", accessToken)
    console.log("refresh token", refreshToken)
    console.log(req.Partner);

    return res.status(201)
      .cookie("accessToken", accessToken, options)
      .cookie("refersToken", refreshToken, options)
      .json(new ApiResponse(
        200,
        {
          Customer: loggedInCustomer, accessToken, refreshToken
        },
        "Customer logged In Successfully"
      ))
  } catch (err) {
    // console.error('Error during login attempt:', err);
    // return res.status(500).json(
    //   new ApiResponse(500, null, `Error Login Partner`)
    // );
    next(err)
  }
};


const uploadIdentification = async (req, res) => {
  const userId = req.user.linkedId; 

  try {
    const { type, id_number } = req.body; 
    const idType = type;
    const idNumber = id_number;
    
    let imageUrls = [];
    const validIdTypes = ["Passport", "National ID"];
    if (!validIdTypes.includes(idType)) {
      return res.status(400).json({ error: "Invalid ID type provided." });
    }
    if (!idNumber) {
      return res.status(400).json({ error: "ID number is required." });
    }
    const customer = await Customer.findById(userId)
    if(!customer){
      return res.status(404).json({
        message : "Customer not exist"
      })
    }
     // Initialize identification if not present
     if (!customer.identification) {
      customer.identification = {
        idType: null,
        idNumber: null,
        idImages: [],
      };
    }

    // Update `type` if provided
    if (type) {
      customer.identification.idType = type;
    }

    // Update `id_number` if provided
    if (id_number) {
      customer.identification.idNumber = id_number;
    }

    // Update images if provided
    if (req.files) {
      const currentImages = customer.identification.idImages || [];

      for (const [key, files] of Object.entries(req.files)) {
        for (const file of files) {
          const localPath = file.path;
          console.log(`Uploading image from path: ${localPath}`);
          const cloudinaryResponse = await cloudinary.uploader.upload(localPath, {
            folder: 'identity_images',
            public_id: `customer_${userId}_${Date.now()}`,
          });

          // Update the images array dynamically based on the key
          if (key === 'front_photo') {
            currentImages[0] = cloudinaryResponse.secure_url; // Front photo at index 0
          } else if (key === 'back_photo') {
            currentImages[1] = cloudinaryResponse.secure_url; // Back photo at index 1
          }
        }
      }
      customer.identification.idImages = currentImages; // Save updated images
    }
      await customer.save();
      const { identification } = customer;
      console.log("Document Saved Successfully.")
      return res.status(200).json(new ApiResponse(200, identification, "Identification details updated successfully."));
  }
   catch (error) {
    console.error("Error uploading identification details:", error);
    return res.status(500).json(new ApiResponse(400, null, "An error occurred while updating identification details." ));
  }
}

export const getCustomerDetailsShort = async (req, res) => {
  const userId = req.user.linkedId;

  try {
    if (!userId) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const userDetails = await Customer.findOne({ _id: new ObjectId(userId) });

    console.log("++  ",userDetails)
    if (!userDetails) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const responseData = {
        fullName : userDetails.fullName,
        phoneNumber : userDetails.phoneNumber,
        imgUrl : userDetails.imgUrl,
    }

    return res.status(200).json(new ApiResponse(200, responseData, "Customer details fetched Successfully"));

  } catch (error) {
    console.error("Error fetching customer details:", error);
    return res.status(500).json(
      new ApiResponse(500, null, `Error fetchong Customer details.`)
    );
  }
};

export const getCustomerIdentification = async (req, res) => {
  const customerId = req.user.linkedId;

  try {
    if(!customerId){
      return res.status(400).json({
        message: "invalid user id"
      })
    }

    const customer = await Customer.findOne({ _id: new ObjectId(customerId) });

    console.log("Customer  ",customer)
    if (!customer) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const responseData = {
      idType : customer.identification.idType,
      idNumber : customer.identification.idNumber,
      idImages : customer.identification.idImages,
    }
    return res.status(200).json(new ApiResponse(200, responseData, "Customer Identification!"));

  } catch (error) {
    console.error("Error fetching customer Identification:", error);
    return res.status(500).json(
      new ApiResponse(500, null, `Error fetchong Customer Identification.`)
    );
  }
}


export { registerCustomer, loginCustomer, uploadIdentification }