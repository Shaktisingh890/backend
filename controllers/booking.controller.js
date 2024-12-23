import { Car } from "../models/car.js";
import { Driver } from "../models/driver.js";
import { Partner } from "../models/partner.js";
import { Customer } from "../models/customer.js";
import { Booking } from "../models/booking.js";
import { ObjectId } from "mongodb";

export const createBooking = async (req, res) => {

    console.log("booking Data is : ", req.body)
    try {
        const { customerId, carId, driverId, partnerId, startDate, endDate, totalAmount } = req.body;

        // Validate that the car is available for the given dates
        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({ error: 'Car not found' });
        }

        const existingBooking = await Booking.findOne({
            carId: carId,
            $or: [
                { startDate: { $lt: endDate }, endDate: { $gt: startDate } },
                { startDate: { $gte: startDate, $lte: endDate } },
                { endDate: { $gte: startDate, $lte: endDate } },
            ],
        });

        if (existingBooking) {
            return res.status(400).json({ message: 'Car is already booked for the selected dates' });
        }
        // Calculate durationInDays
        const start = new Date(startDate);
        const end = new Date(endDate);
        const durationInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        // Create a new booking
        const newBooking = new Booking({
            customerId,
            carId,
            driverId,
            partnerId,
            startDate,
            endDate,
            totalAmount,
            durationInDays,
        });

        await newBooking.save();

        res.status(201).json({ message: 'Booking created successfully', booking: newBooking });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
}

export const getBookingByCarId = async (req, res) => {
    const carId = req.params.carId;
     try {
        if(!carId || !ObjectId.isValid(carId)){
            return res.status(400).json({success : false , message: " Invalid or missing Car Id" });
        }

        const bookings = await Booking.find({ carId : new ObjectId(carId)});
        if(bookings.length === 0){
            return res.status(404).json({success : false, message : " No Bookings Found! "});
        }

        console.log("Bookings : ",bookings);
        res.status(200).json({ 
            success: true, 
            message: "Booking Fetched SucccessFully",
            data: bookings
        })
     } catch (error) {
        console.error("Error fetching Bookings : ",error)
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
     }
}

export const getBookingByUserId = async (req, res) => {
    const userId = req.user;
    
    try {
        if(!userId || !ObjectId.isValid(userId)){
            return res.status(400).json({
                success : false,
                message: "Invalid or missing UserId"
            })
        }
        const bookings = await Booking.find({ customerId : new ObjectId(userId)}).populate('carId')
        if(bookings.length === 0){
            return res.status(404).json({
                success : false,
                message: " No Booking found! " 
            })
        }

        console.log("Bookings : ",bookings)
        res.status(200).json({
            success : true,
            message : "Bookings SucccessFully Fetched ",
            data : bookings
        })
    } catch (error) {
        console.error("Error fetching Bookings : ",error)
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });  
    }
}

export const getBookingByDriverId = async( req, res) => {
    const driverId = req.user;
    try {
        if(!driverId || !ObjectId.isValid(driverId)){
            return res.status(400).json({
                success : false,
                message: "Invalid or missing Driver Id"
            })
        }

        const bookings = await Booking.find({ driverId : new ObjectId(driverId)}).populate('customerId')
        if(bookings.length === 0){
            return res.status(404).json({
                success : false,
                message : "Bookings Not found!"
            })
        }

        console.log("bookings : ",bookings)

        res.status(200).json({
            success : true,
            message : "bookings SuccessFully fetched!",
            data : bookings
        })
    } catch (error) {
        console.error("Error fetching Bookings : ",error)
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });  
    }
}

export const getAllBooking = async (req, res) => {
    try {
        const bookings = await Booking.find()
        console.log("Data : ", bookings)
        return res.status(200).json({
            message: "Booking fetchewd",
            data: bookings
        })
    } catch (error) {
        return res.status(404).json({ message: " data not found" })
    }
}

export const updateBookingPaymentStatus = async (req, res) => {
    const { bookingId, paymentStatus } = req.body;
    console.log("request : ", req.body)

    try {
        const booking = await Booking.findById(bookingId);
        console.log("Booking : ", booking)
        if (!booking) {
            throw new Error('Booking not found');
        }
        booking.paymentStatus = paymentStatus;

        if (paymentStatus === 'completed') {
            booking.status = 'booked'; // Optionally, update booking status based on payment
        } else {
            console.log("Not Matched")
        }
        await booking.save();
        return booking;
    } catch (error) {
        throw new Error('Failed to update payment status');
    }
};

export const deleteBookingById = async (req, res) => {
    const driverId = req.params.driverId;

    console.log("Booking ID:", driverId);

    try {
        // Convert bookingId to ObjectId
        if (!ObjectId.isValid(driverId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Booking ID format",
            });
        }

        const driver = new ObjectId(driverId);
        console.log("objectId Booking:", driver);


        // Find and delete the booking
        const deletedBooking = await Booking.findOneAndDelete({driverId : driver});

        console.log("Deleted Booking:", deletedBooking);

        if (!deletedBooking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found with the provided ID",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Booking deleted successfully",
            data: deletedBooking,
        });
    } catch (error) {
        console.error("Error deleting booking:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// {
//     "customerId": "6757e97d55efdf2920549202",
//     "carId": "675810ecca5750437b8b0de8",
//     "driverId": "6757e97d55efdf2920549202",
//     "partnerId": "6757e97d55efdf2920549202",
//     "startDate": "2024-12-15T10:00:00Z",
//     "endDate": "2024-12-20T10:00:00Z",
//     "totalAmount": 5000
//   }