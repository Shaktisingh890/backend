import fs from 'fs';
import { Car } from "../models/car.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js";
import cloudinary from "../config/cloudinary.js"
import { ObjectId } from "mongodb";
import { Booking } from "../models/booking.js";

export const addCar = async function (req, res, next) {
    try {
      const carDetails = req.body.carDetails ? JSON.parse(req.body.carDetails) : req.body.carDetails;
  
      // Debug: Log the carDetails to see its contents
       console.log( carDetails);
  
      // Ensure the carDetails object is not empty or undefined
      if (!carDetails) {
        throw new ApiError(400, "carDetails is missing or empty");
      }
  
      const {
        carName,  // Check if this works after parsing
        carModel,
        carYear,
        seatingCapacity,
        fuelType,
        dailyRentalPrice,
        carMileagePerHour: mileage,
        carColor: color,
        description,
        features,
        category,
        subcategory,
        pickupLocation,
        dropoffLocation,
        registrationNumber,
        transmissionType
      } = carDetails;
  
      // Debugging: Check if carName is properly destructured
    
      const imageUrls = [];
     
    if (req.files) {
        for (const key in req.files) {
          if (req.files[key]) {
            // Assuming file names are 'image0', 'image1', etc.
            const localPath = req.files[key][0].path;  // Path to the uploaded file
            console.log(`Uploading ${key}: ${localPath}`);
            
            // Upload image to Cloudinary
            const cloudinaryResponse = await cloudinary.uploader.upload(localPath, {
              folder: 'partner_photos',  // Optional: specify a folder in Cloudinary
              public_id: `${req.user.email}_${key}`,  // Optionally specify a public ID (e.g., email or a unique identifier)
            });
  
            // Push Cloudinary URL into imageUrls array
            imageUrls.push(cloudinaryResponse.secure_url);
  
            // Delete the local file after upload
            fs.unlinkSync(localPath);
          }
        }
      }
  

      // Rest of the logic...
      const carData = {};
  
      // Dynamically populate the carData object
      if (carName) carData.brand = carName;
      if (carModel) carData.model = carModel;
      carData.partnerId=req.user._id;
     
      if (carYear) carData.year = carYear;
      if (seatingCapacity) carData.seats = seatingCapacity;
      if (fuelType) carData.fuelType = fuelType;
      if (dailyRentalPrice) carData.pricePerDay = dailyRentalPrice;
      if (mileage) carData.milage = mileage;
      if (color) carData.color = color;
      if (description) carData.description = description;
  
      // Add the static location
      carData.location = {
        type: "Point",
        coordinates: [12.9716, 77.5946]  // Static coordinates (example: Bengaluru, India)
      };
  
      if (features) carData.features = features;
      if (category) carData.category = category;
      if (subcategory) carData.subCategory = subcategory;
      if (pickupLocation) carData.pickupLocation = pickupLocation;
      if (dropoffLocation) carData.dropoffLocation = dropoffLocation;
      if (registrationNumber) carData.registrationNumber = registrationNumber;
      if (transmissionType) carData.transmissionType = transmissionType;
      if (imageUrls.length > 0) {
        carData.images = imageUrls;  // Store the Cloudinary image URLs in the 'images' array
      }
  
      console.log("Car Data : ",carData);
      // Save logic...
      const newCar = new Car(carData);
      const savedCar = await newCar.save();
      console.log("Car Saved  : ",savedCar);


      res.status(201).json({
        success: true,
        message: "Car added successfully.",
        data: savedCar
      });
    } catch (error) {
      next(new ApiError(400, error.message || "Internal Server Error."));
    }
  };





export const getAllCars = async (req, res) => {
    try {
        const cars = await Car.find()
        console.log("All Cars", cars)
        return res.status(200).json({
            message: "All Cars Successfully fetched",
            data: cars
        })
    } catch (error) {
        console.log("Error to fetch cars : ", error)
        return res.status(404).json({
            message: "Data not found"
        })
    }
}

export const getCarById = async (req, res) => {
    const carId = req.params.carId;
    console.log("Car Id : ", carId)
    try {
        const cardetails = await Car.findById({ _id: new ObjectId(carId) }).populate('partnerId')
        const bookings = await Booking.find({ carId: new ObjectId(carId) })
        console.log("Car Details : ", cardetails)
        if (cardetails) {
            res.status(200).json({
                message: " car Details Successfully fetched",
                data: { cardetails, bookings, }
            })
        } else {
            res.status(404).json({
                message: "Car not exist"
            })
        }
    } catch (error) {
        console.log("internal server error")
    }
}

export const getCarByUserId = async (req, res) => {
    const userId = req.user;

    try {
        // Validate userId
        if (!userId || !ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid or missing User ID" });
        }

        // Fetch car details
        const carDetails = await Car.find({ partnerId: new ObjectId(userId) });

        if (carDetails.length === 0) {
            console.log("No car details found!")
            return res.status(404).json({ success: false, message: "No car details found!" });
        }

        console.log("Car details:", carDetails);
        res.status(200).json({
            success: true,
            message: "Car details fetched successfully",
            cars: carDetails,
        });
    } catch (error) {
        console.error("Error fetching car details:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const updateCarDetails = async (req, res) => {
    const carId = req.params.carId;
    const updateDetails = req.body;

    console.log("Car id for Update : ", carId)
    console.log("Car Details for Update : ", updateDetails)

    try {
        console.log("Update car Function run........")
        const result = await Car.updateOne({ _id: new ObjectId(carId) }, { $set: updateDetails })
        if (result.matchedCount > 0) {
            console.log(`Car with id : ${carId} updated Successfully`)
            res.status(200).json({ message: `Car with id : ${carId} updated Successfully` })
        } else {
            console.log(`Car with Id ${carId} not found !`)
            res.status(404).json({ message: `Car with Id ${carId} not found !` })
        }
    } catch (error) {
        console.log("Error in update car function. invalid id")
        res.status(500).json({ error: "Failed to update car." });

    }
}

export const deleteCar = async (req, res) => {
    const carId = req.params.carId;
    console.log("Car id for Delete : ", carId)

    try {
        const result = await Car.deleteOne({ _id: new ObjectId(carId) });
        console.log("Result : ", result)
        if (result.deletedCount > 0) {
            console.log("Car deleted SuccessFully")
            res.status(200).json({ message: `Car with id : ${carId} deleted SuccessFully` })
        } else {
            console.log("Car not found or not deleted")
            res.status(404).json({ message: `Car with id : ${carId} not Found` })
        }
    } catch (error) {
        console.error("this error : ", error);
        res.status(500).json({ error: "Failed to delete car." });
    }
}