import {Car} from "../models/car.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js";
import cloudinary from "../config/cloudinary.js"

export const addCar = async function (req, res, next) {
    try {
        // Destructure data from the request body
        const {
            brand,
            model,
            year,
            seats,
            fuelType,
            pricePerDay,
            availabilityStatus,
            location,
            features,
        } = req.body;

        console.log("My linked id is ", req.user);
        const partnerId = req.user.linkedId;

        console.log(req.body)

        // Validate required fields
        if (!brand || !model || !year || !seats || !fuelType || !pricePerDay || !location || !location.coordinates) {
            throw new ApiError(400, "Missing required fields.");
        }

        const images = [];

        // Check if files exist in the request and process them
        if (req.files && Object.keys(req.files).length > 0) {
            for (const fileKey of Object.keys(req.files)) {
                const localPath = req.files[fileKey][0].path;
                console.log(`Uploading file from path: ${localPath}`);

                try {
                    const cloudinaryResponse = await cloudinary.uploader.upload(localPath, {
                        folder: 'car_photos', // Optional: specify a folder in Cloudinary
                        public_id: `${brand}_${fileKey}`, // Optionally specify a public ID
                    });

                    const imageUrl = cloudinaryResponse.secure_url;
                    images.push(imageUrl);
                } catch (uploadError) {
                    console.error(`Error uploading file ${fileKey}:`, uploadError.message);
                }
            }
        } 
        else {
            console.log("No files found in the request.");
        }

        // Create a new car object
        const newCar = new Car({
            brand,
            model,
            year,
            seats,
            fuelType,
            pricePerDay,
            availabilityStatus: availabilityStatus || "available", // Use default if not provided
            location: {
                type: "Point",
                coordinates: location.coordinates, // Expecting [longitude, latitude]
            },
            features: features || [], // Optional, default to empty array
            images: images, // Push all image URLs to this array
            partnerId,
        });

        // Save the car to the database
        const savedCar = await newCar.save();

        // Send a success response
        res.status(201).json(new ApiResponse(201, "Car added successfully.", savedCar));
    } catch (error) {
        // Handle errors and pass them to the error handler
        next(new ApiError(400, error.message || "Internal Server Error."));
    }
};


export const getAllCars = async( req, res) => {
    try {
        const cars = await Car.find()
        console.log("All Cars",cars)
        return res.status(200).json({
            message: "All Cars Successfully fetched",
            data : cars
        })
    } catch (error) {
        console.log("Error to fetch cars : ",error)
        return res.status(404).json({
            message:"Data not found"
        })
    }
}

