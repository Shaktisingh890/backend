
import express from 'express';
import cookieParser from 'cookie-parser';

const app = express()
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser());



//routes import
import userRouter from './routes/user.routes.js';
import customerRouter from './routes/customer.routes.js';
import driverRouter from './routes/driver.routes.js';
import partnerRouter from './routes/partner.routes.js';
import carRouter from './routes/car.routes.js'

app.post("/registerDriver", (req, res) => {
    console.log(req.body); // Log non-file fields
    console.log(req.files); // Log uploaded files
});


//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/customers",customerRouter);
app.use("/api/v1/drivers",driverRouter);
app.use("/api/v1/partners",partnerRouter);
app.use("/api/v1/cars",carRouter)

export { app }


// check push request
