import { Car } from "../models/car.js";
import { Driver } from "../models/driver.js";
import { Partner } from "../models/partner.js";
import { Customer } from "../models/customer.js";
import { Booking } from "../models/booking.js";
import { ObjectId } from "mongodb";
import { sendPushNotification } from "../services/NotificationServices.js";

export const createBooking = async (req, res) => {

    console.log("booking Data is : ", req.body)
    try {
        const { customerId, carId, withDriver, startDate, endDate, totalAmount } = req.body;
        console.log("All Data : ",req.body)
    
        // Validate that the car is available for the given dates
        const car = await Car.findById(carId);
        console.log("cars : ",car)
        if (!car) {
            return res.status(404).json({ error: 'Car not found' });
        }
        const partnerId = car.partnerId;
        const partner = await Partner.findById(partnerId);
        // Calculate durationInDays
        const start = new Date(startDate);
        const end = new Date(endDate);
        const durationInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        // Create a new booking
        const newBooking = new Booking({
            customerId,
            carId,
            partnerId,
            startDate,
            endDate,
            totalAmount,
            durationInDays,
            driverStatus: withDriver ? 'pending' : 'not_needed',
        });

        console.log("New Booking : ",newBooking)
        const title = "🔔New Car Booking Alert!";
        const body = `Hello ${partner.fullName}, a customer has successfully booked your car ${car.brand} ${car.model}. Please check the booking details.`

        console.log("DeviceToken ",partner.deviceTokens )
        console.log("Title : ",title )
        console.log("Body:  ",body )

        // await newBooking.save();
        await sendPushNotification(partner.deviceTokens, title, body);

        // res.status(201).json({ message: 'Booking created and sent to partner for approval', booking: newBooking });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
}

export const getBookingByPartner = async( req,res ) => {
  const partner = req.user;
  console.log("partner : ",partner);

  const partner_Id = partner.linkedId;

  try {
    if(!partner_Id || !ObjectId.isValid(partner_Id)){
        return res.status(400).json({success : false , message: " Invalid or missing partnerId" });
    }
    const bookings = await Booking.find({partnerId: new ObjectId(partner_Id)})
    if(bookings.length === 0){
        return res.status(404).json({success : false, message : " No Bookings Found! "});
    }

    const bookingMap = bookings.map((obj) => {
        return obj.carId;
    })
    console.log("bookingMap : ",bookingMap);


    const carDetails = await Car.find({ _id: { $in: bookingMap.map(id => new ObjectId(id)) } });
    console.log("carDetails : ",carDetails);

    console.log("booking : ",bookings)
  } catch (error) {
    
  }
}

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