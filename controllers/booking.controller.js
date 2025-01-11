import { Car } from "../models/car.js";
import { Driver } from "../models/driver.js";
import { Partner } from "../models/partner.js";
import { Customer } from "../models/customer.js";
import { Booking } from "../models/booking.js";
import { ObjectId } from "mongodb";
import { sendPushNotification } from "../services/NotificationServices.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import moment from 'moment';

export const createBooking = async (req, res) => {
  const customerId = req.user.linkedId;
  const {
    carId,
    isDriverRequired,
    partnerId,
    pickUpLocation,
    returnLocation,
    durationInHours,
    pickUpDateTime,
    returnDateTime,
    totalRent,
  } = req.body;

  try {
    // Validate that the car exists
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ error: "Car not found" });
    }

    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ error: "Partner not found" });
    }

    
    const start = moment(pickUpDateTime, 'DD/MM/YYYY HH:mm').toDate();
    const end = moment(returnDateTime, 'DD/MM/YYYY HH:mm').toDate();

    // Check if the car is already booked during the specified time range
    const existingCarBooking = await Booking.findOne({
      carId,
      $or: [
        { pickUpDateTime: { $lte: end }, returnDateTime: { $gte: start } },
        { pickUpDateTime: { $gte: start }, returnDateTime: { $lte: end } },
      ],
    });

    if (existingCarBooking) {
      return res.status(400).json({
        error:
          "Car is already booked during the specified time. Please choose another time.",
      });
    }

    // Check if the customer already has a booking during the same time range
    const existingCustomerBooking = await Booking.findOne({
      customerId,
      $or: [
        { pickUpDateTime: { $lte: end }, returnDateTime: { $gte: start } },
        { pickUpDateTime: { $gte: start }, returnDateTime: { $lte: end } },
      ],
    });

    if (existingCustomerBooking) {
      return res.status(400).json({
        error:
          "You already have a booking during the specified time. Please choose another time.",
      });
    }

    // Create the booking
    const newBooking = new Booking({
      customerId,
      carId,
      partnerId,
      pickupLocation: pickUpLocation,
      dropoffLocation: returnLocation,
      startDate: start,
      endDate: end,
      totalAmount: totalRent,
      durationInDays: durationInHours, // Ensure this is the correct unit (Days)
      driverStatus: isDriverRequired ? "pending" : "accepted",
    });

    const savedBooking = await newBooking.save();

    // Use aggregation pipeline to include only brand and model from car data
    const bookingWithCarData = await Booking.aggregate([
      { $match: { _id: savedBooking._id } },
      {
        $lookup: {
          from: "cars", // Collection name for cars
          localField: "carId",
          foreignField: "_id",
          as: "carData",
        },
      },
      {
        $unwind: {
          path: "$carData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          customerId: 1,
          carId: 1,
          partnerId: 1,
          pickupLocation: 1,
          dropoffLocation: 1,
          startDate: 1,
          endDate: 1,
          totalAmount: 1,
          durationInDays: 1,
          driverStatus: 1,
          paymentStatus: 1,
          partnerStatus: 1,
          carData: { brand: 1, model: 1, pricePerDay: 1 }, // Only include brand and model from carData
        },
      },
    ]);

    if (!bookingWithCarData.length) {
      return res
        .status(500)
        .json({ error: "Failed to retrieve booking data with car details" });
    }
    const title = "New Car Booking Alert!";
    const body = `Hello ${partner.fullName}, a customer has successfully booked your car ${car.brand} ${car.model}. Please check the booking details.`;
    const dataPayload = {
      bookingId: savedBooking._id.toString(),
      click_action: "OPEN_PARTNER_BOOKING_REQUEST",
    };
    await sendPushNotification(partner.deviceTokens, title, body,dataPayload);

    res
      .status(201)
      .json(
        new ApiResponse(
          200,
          bookingWithCarData[0],
          "Booking created and sent to partner for approval"
        )
      );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create booking" });
  }
};

export const getBookingByPartner = async (req, res) => {
  const partner = req.user.linkedId;
  console.log("partner : ", partner);

  try {
    if (!partner || !ObjectId.isValid(partner)) {
      return res
        .status(400)
        .json({ success: false, message: " Invalid or missing partnerId" });
    }
    const bookings = await Booking.find({
      partnerId: new ObjectId(partner),
    });
    if (bookings.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: " No Bookings Found! " });
    }

    const bookingMap = bookings.map((obj) => {
      return obj.carId;
    });
    // console.log("bookingMap : ", bookingMap);

    const carDetails = await Car.find({
      _id: { $in: bookingMap.map((id) => new ObjectId(id)) },
    });
    // console.log("carDetails : ", carDetails);

    console.log("booking : ", bookings);
  } catch (error) {
    console.log("Error : ",error)
  }
};

// export const partnerConfirmBooking = async (req, res) => {
//     const {bookingId, driverId } = req.body;
//     console.log(req.body);

//     try {
//         const booking = await Booking.findById(bookingId);
//         console.log("Booking Found : ",booking)
//         if(!booking) {
//             return res.status(404).json({ error: " Booking Not Found "});
//         }

//         booking.driverId = driverId;
//         booking.partnerStatus = 'confirmed'

//         console.log("Now Booking Status: ",booking)
//         await booking.save();

//         // await sendPushNotification(driver.deviceTokens, title, body);

//         res.status(200).json({message: " Booking confirmed by the partner, driver Notified"})
//     } catch (error) {
//         console.error("Ye Error : ",error);
//         res.status(500).json({error : "Failed to confirm booking by partner"})
//     }
// }

// // Function to send notification to driver
// const sendDriverNotification = async (driverId, bookingId) => {
//     // Assuming you have a driver model to find driver details
//     const driver = await Driver.findById(driverId);
//     const message = `You have a new booking request. Please confirm or reject the booking. Booking ID: ${bookingId}`;

//     // Send notification to driver (email, SMS, in-app)
//     await sendEmail(driver.email, 'New Booking Request', message);
//   };

//   export const driverConfirmBooking = async (req, res) => {
//     const { bookingId, driverStatus } = req.body; // driverStatus can be 'accepted' or 'rejected'

//     try {
//       const booking = await Booking.findById(bookingId);
//       if (!booking) {
//         return res.status(404).json({ error: 'Booking not found' });
//       }

//       // Update the driver status based on the driver's action
//       booking.driverStatus = driverStatus;
//       await booking.save();

//       if (driverStatus === 'accepted') {
//         // Notify the partner that the driver accepted
//         await sendPartnerNotification(booking.partnerId, bookingId);
//         res.status(200).json({ message: 'Driver accepted the booking' });
//       } else {
//         // Notify both partner and customer that the driver rejected
//         await sendRejectionNotifications(booking.partnerId, booking.customerId, bookingId);
//         res.status(200).json({ message: 'Driver rejected the booking' });
//       }
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'Failed to update driver status' });
//     }
//   };

//   // Send rejection notifications to partner and customer
// const sendRejectionNotifications = async (partnerId, bookingId) => {
//     const partner = await Partner.findById(partnerId);

//     // Notify partner
//     const partnerMessage = `Driver rejected the booking. Please select another driver for Booking ID: ${bookingId}`;
//     await sendEmail(partner.email, 'Booking Rejected by Driver', partnerMessage);

//   };

//   export const partnerFinalConfirm = async (req, res) => {
//     const { bookingId } = req.body;

//     try {
//       const booking = await Booking.findById(bookingId);
//       if (!booking) {
//         return res.status(404).json({ error: 'Booking not found' });
//       }

//       // Final confirmation by partner
//       booking.status = 'confirmed'; // Booking finalized

//       await booking.save();

//       // Notify customer and driver about the final confirmation
//       await sendFinalNotification(booking.customerId, booking.driverId, bookingId);

//       res.status(200).json({ message: 'Booking confirmed successfully' });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'Failed to confirm booking by partner' });
//     }
//   };

//   // Send final confirmation notification to customer and driver
// const sendFinalNotification = async (customerId, driverId, bookingId) => {
//     const customer = await Customer.findById(customerId);
//     const driver = await Driver.findById(driverId);

//     // Notify customer
//     const customerMessage = `Your booking has been confirmed. Booking ID: ${bookingId}`;
//     await sendEmail(customer.email, 'Booking Confirmed', customerMessage);

//     // Notify driver
//     const driverMessage = `You have been assigned to a new booking. Booking ID: ${bookingId}`;
//     await sendEmail(driver.email, 'Booking Assigned', driverMessage);
//   };

export const getBookingByCarId = async (req, res) => {
  const carId = req.params.carId;
  try {
    if (!carId || !ObjectId.isValid(carId)) {
      return res
        .status(400)
        .json({ success: false, message: " Invalid or missing Car Id" });
    }

    const bookings = await Booking.find({ carId: new ObjectId(carId) });
    if (bookings.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: " No Bookings Found! " });
    }

    // console.log("Bookings : ", bookings);
    res.status(200).json({
      success: true,
      message: "Booking Fetched SucccessFully",
      data: bookings,
    });
  } catch (error) {
    console.error("Error fetching Bookings : ", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getBookingByUserId = async (req, res) => {
  const userId = req.user;

  try {
    if (!userId || !ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing UserId",
      });
    }
    const bookings = await Booking.find({
      customerId: new ObjectId(userId),
    }).populate("carId");
    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: " No Booking found! ",
      });
    }

    // console.log("Bookings : ", bookings);
    res.status(200).json({
      success: true,
      message: "Bookings SucccessFully Fetched ",
      data: bookings,
    });
  } catch (error) {
    console.error("Error fetching Bookings : ", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getBookingByDriverId = async (req, res) => {
  const driverId = req.user;
  try {
    if (!driverId || !ObjectId.isValid(driverId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing Driver Id",
      });
    }

    const bookings = await Booking.find({
      driverId: new ObjectId(driverId),
    }).populate("customerId");
    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Bookings Not found!",
      });
    }

    // console.log("bookings : ", bookings);

    res.status(200).json({
      success: true,
      message: "bookings SuccessFully fetched!",
      data: bookings,
    });
  } catch (error) {
    console.error("Error fetching Bookings : ", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getAllBooking = async (req, res) => {
  try {
    const bookings = await Booking.find();
    // console.log("Data : ", bookings);
    return res.status(200).json({
      message: "Booking fetchewd",
      data: bookings,
    });
  } catch (error) {
    return res.status(404).json({ message: " data not found" });
  }
};

export const updateBookingPaymentStatus = async (req, res) => {
  const { bookingId, paymentStatus } = req.body;
  // console.log("request : ", req.body);

  try {
    const booking = await Booking.findById(bookingId);
    // console.log("Booking : ", booking);
    if (!booking) {
      throw new Error("Booking not found");
    }
    booking.paymentStatus = paymentStatus;

    if (paymentStatus === "completed") {
      booking.status = "booked"; // Optionally, update booking status based on payment
    } else {
      console.log("Not Matched");
    }
    await booking.save();
    return booking;
  } catch (error) {
    throw new Error("Failed to update payment status");
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
    // console.log("objectId Booking:", driver);

    // Find and delete the booking
    const deletedBooking = await Booking.findOneAndDelete({ driverId: driver });

    // console.log("Deleted Booking:", deletedBooking);

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

export const getBookingById = async (req, res) => {
  const  bookingId  = req.params.bookingId;

  try {
      
      if (!bookingId) {
          return res.status(400).json(new ApiError( 400, {}, "Booking ID is required" ));
      }

      const booking = await Booking.findById(bookingId);

      if (!booking) {
          return res.status(404).json({ message: "Booking not found" });
      }

      
      const car = await Car.findById(booking.carId)

      if (!car) {
        return res.status(404).json({ message: "car not found" });
      }

      const data = {
        ...booking.toObject(),
        carModel :car.model,
        carName: car.brand,
        pricePerDay:car.pricePerDay,
    };
      return res.status(200).json(new ApiResponse(200, data, "Booking fetched successfully"));
      
  } catch (error) {
      console.error("Error fetching booking:", error);
      return res.status(500).json(new ApiError(500, {}, "Error fetching booking"));
  }
};
