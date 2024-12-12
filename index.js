import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

// Import route handlers
import userRouter from './routes/user.routes.js';
import customerRouter from './routes/customer.routes.js';
import driverRouter from './routes/driver.routes.js';
import partnerRouter from './routes/partner.routes.js';
import carRouter from './routes/car.routes.js';
import bookingRouter from './routes/booking.routes.js'

// Initialize dotenv
dotenv.config({
  path: './.env'
});

// Initialize express app
const app = express();

// Middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Request Logger Middleware (logs incoming requests)
const requestLogger = (req, res, next) => {
  console.log('--- Incoming Request ---');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('------------------------');
  
  next();
};

// Use the request logger middleware to log all incoming requests
app.use(requestLogger);

// Register a test endpoint
app.post("/registerDriver", (req, res) => {
  console.log(req.body); // Log non-file fields
  console.log(req.files); // Log uploaded files
});

// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/customers", customerRouter);
app.use("/api/v1/drivers", driverRouter);
app.use("/api/v1/partners", partnerRouter);
app.use("/api/v1/cars", carRouter);
app.use("/api/v1/booking", bookingRouter);


// Connect to the database
connectDB();

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export { app };
