import fs from 'fs';
import { Car } from "../models/car.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js";
import cloudinary from "../config/cloudinary.js"
import { ObjectId } from "mongodb";
import { Booking } from "../models/booking.js";



// The updated addCar function
export const addCar = async function (req, res, next) {
  try {
    const carDetails = req.body.carDetails ? JSON.parse(req.body.carDetails) : req.body.carDetails;

    // Ensure the carDetails object is not empty or undefined
    if (!carDetails) {
      throw new ApiError(400, "carDetails is missing or empty");
    }

    const {
      carName,
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

    // Check if required fields are missing
    if (!carName || !carModel || !carYear) {
      throw new ApiError(400, "Missing required fields in car details.");
    }

    // Initialize an array to hold image URLs
    let imageUrls = [];

    // Process the uploaded images
    if (req.files) {
      // Loop over the files object to process each image field dynamically
      for (const [key, files] of Object.entries(req.files)) {
        for (let file of files) {
          const localPath = file.path;
          console.log(`Uploading image from path: ${localPath}`);

          const cloudinaryResponse = await cloudinary.uploader.upload(localPath, {
            folder: 'car_images',  // You can specify the folder on Cloudinary
            public_id: `${carModel}_${Date.now()}`,  // You can customize the public_id
          });

          // Push the image URL to the images array
          imageUrls.push(cloudinaryResponse.secure_url);
        }
      }
    } else {
      console.log("No images uploaded");

    }

    // Populate the car data object dynamically
    const carData = {};

    if (carName) carData.brand = carName;
    if (carModel) carData.model = carModel;
    if (carYear) carData.year = carYear;
    if (seatingCapacity) carData.seats = seatingCapacity;
    if (fuelType) carData.fuelType = fuelType;
    if (dailyRentalPrice) carData.pricePerDay = dailyRentalPrice;
    if (mileage) carData.milage = mileage;
    if (color) carData.color = color;
    if (description) carData.description = description;

    // Add the static location (example coordinates)
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
    carData.partnerId=req.user.linkedId;
    // Add the images array to the carData object
    if (imageUrls.length > 0) {
      carData.images = imageUrls;  // Store the Cloudinary image URLs
    }


    // Save the car data to the database
    const newCar = new Car(carData);
    const savedCar = await newCar.save();

    

    res.status(201).json(
        new ApiResponse (201,savedCar,"Car added successfully.")
    )

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
    const userId = req.user.linkedId;
    console.log(userId)
    try {
        // Validate userId
        if (!userId || !ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid or missing User ID" });
        }

        // Fetch car details
        const carDetails = await Car.find({ partnerId: new ObjectId(userId) });

        if (carDetails.length === 0) {
            return res.status(404).json({ success: false, message: "No car details found!" });
        }

        console.log("Car details:", carDetails);
      

        res.status(200).json(
            new ApiResponse(201,carDetails,"Car details fetched successfully")
            
        );
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
            res.status(200).json({ message: `Car with id : ${carId} updated Successfully `})
        } else {
            console.log(`Car with Id ${carId} not found !`)
            res.status(404).json({ message: `Car with Id ${carId} not found ! `})
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

export const getCarByCost = async (req, res) => {
    try {
      // Destructure the query parameters
      console.log("User : : ", req.user);
  
      const { filter } = req.query;
  
      console.log("Filter : ", filter);
      
      // Set the price threshold for 'low_cost' and 'normal_cost'
      const priceThreshold = 680;
  
      // Build the filter query object
      let filterQuery = {};
  
      // Handle low cost or normal cost filters
      if (filter === 'low_cost') {
        filterQuery.pricePerDay = { $lte: priceThreshold }; // Cars with price <= 680
      } else if (filter === 'normal_cost') {
        filterQuery.pricePerDay = { $gt: priceThreshold }; // Cars with price > 680
      }
  
      // Query the database with the filter query object
      const cars = await Car.find(filterQuery);
   console.log("Cars : ",cars)
      // Return the filtered cars in the response
      return res.status(200).json({ cars: cars });
    } catch (error) {
      console.error('Error fetching filtered cars:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  
