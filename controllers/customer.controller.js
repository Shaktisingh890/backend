import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import fs from "fs";
import jwt from 'jsonwebtoken';
import cloudinary from '../config/cloudinary.js';
import { Customer } from "../models/customer.js";
import { cursorTo } from "readline";
import User from "../models/user.js";


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
  console.log("User : ",userId)
  try {
    const { idType, idNumber } = req.body; 
    console.log(req.body)
    let imageUrls = [];

    const validIdTypes = ["passport", "nationalId"];
    if (!validIdTypes.includes(idType)) {
      return res.status(400).json({ error: "Invalid ID type provided." });
    }

    if (!idNumber) {
      return res.status(400).json({ error: "ID number is required." });
    }

    if (req.files) {
      for (const [key, files] of Object.entries(req.files)) {
        for (const file of files) {
          const localPath = file.path;
          console.log(`Uploading image from path: ${localPath}`);

          // Upload to Cloudinary
          const cloudinaryResponse = await cloudinary.uploader.upload(localPath, {
            folder: 'identity_images',
            public_id: `customer_${userId}_${Date.now()}`, 
          });

          imageUrls.push(cloudinaryResponse.secure_url);
        }
      }

      // // Ensure at least two images are provided
      // if (imageUrls.length < 2) {
      //   return res.status(400).json({ error: "At least two identification images are required." });
      // }

      const customer = await Customer.findById(userId);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found." });
      }

      customer.identification = {
        idType,
        idNumber,
        idImages: [
          ...(customer.identification?.idImages || []), 
          ...imageUrls,
        ],
      };

      console.log("Customer : ",customer)
      await customer.save();

      return res.status(200).json({
        message: "Identification details updated successfully.",
        identification: customer.identification,
      });
    } else {
      console.log("No images uploaded");
      return res.status(400).json({ error: "No files to upload." });
    }
  } catch (error) {
    console.error("Error uploading identification details:", error);
    return res.status(500).json({ error: "An error occurred while updating identification details." });
  }
};


export { registerCustomer, loginCustomer, uploadIdentification }