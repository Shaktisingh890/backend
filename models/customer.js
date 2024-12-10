import mongoose,{Schema} from "mongoose";
import bycrypt from 'bcrypt';

import jwt from 'jsonwebtoken'



const customerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed password
  phoneNumber: { type: String, required: true },
  address: { type: String },
  imgUrl:{type:String},

  // Booking history for this customer
  bookingHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],

}, { timestamps: true });


customerSchema.pre("save", async function(next) {
  if(!this.isModified("password")) return next();
  this.password= await bycrypt.hash(this.password,10);
  return next();
  
})





export const Customer = mongoose.model('Customer', customerSchema);
