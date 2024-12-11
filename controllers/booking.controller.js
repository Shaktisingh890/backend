import { Car } from "../models/car.js";
import { Driver } from "../models/driver.js";
import { Partner } from "../models/partner.js";
import { Customer } from "../models/customer.js";
import { Booking } from "../models/booking.js";

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
                { startDate: { $lt: endDate }, endDate: { $gt: startDate } }, // Overlap condition
                { startDate: { $gte: startDate, $lte: endDate } }, // Booking starts during requested period
                { endDate: { $gte: startDate, $lte: endDate } }, // Booking ends during requested period
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

export const getAllBooking = async(req,res) => {
    try {
        const bookings = await Booking.find()
        console.log("Data : ",bookings)
        return res.status(200).json({
            message: "Booking fetchewd",
            data : bookings
        })
    } catch (error) {
        return res.status(404).json({message: " data not found"})
    }
}

export const updateBookingPaymentStatus = async (req, res) => {

    const { bookingId, paymentStatus } = req.body;
    console.log("request : ",req.body)

    try {
        const booking = await Booking.findById(bookingId);
        console.log("Booking : ",booking)
        if (!booking) {
            throw new Error('Booking not found');
        }

        booking.paymentStatus = paymentStatus;

        if (paymentStatus === 'completed') {
            booking.status = 'booked'; // Optionally, update booking status based on payment
        }else{
            console.log("Not Matched")
        }

        await booking.save();
        return booking;
    } catch (error) {
        throw new Error('Failed to update payment status');
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