import mongoose,{Schema} from 'mongoose';
import bycrypt from "bcrypt";
import jwt from "jsonwebtoken";
const partnerSchema = new Schema({
    fullName: { type: String, required: true },
    email:{type:String,required:true,unique:true},
    phoneNumber: { type: String, required: true },
    address:{type:String},
    password:{type:String,requird:true},
    fleet: [{ type: Schema.Types.ObjectId, ref: 'Car' }], // List of cars under this partner
    drivers: [{ type: Schema.Types.ObjectId, ref: 'Driver' }], // List of drivers
    imgUrl:{type:String,default:null},
    refreshToken:{type:String,default:null},
    paymentDetails: {
      accountNumber: String,
      bankName: String,
    },
    termsAccepted: { type: Boolean, default: false }
  });
  

partnerSchema.pre("save",function(next){
  if(!this.isModified("password")) return next();
  return this.password=bycrypt.hash(this.password,10);
})  

partnerSchema.methods.generateAccessToken=function(){
  return jwt.sign(
    {
      _id:this._id,
      type:"partner"
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}

partnerSchema.methods.generateRefreshToken=function(){
  return jwt.sign(
    {
     _id:this._id,
      type:"partner"
    },process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}


partnerSchema.methods.isPasswordCorrect=function(password){
  return bycrypt.compare(password,this.password)
 } 


  export const Partner=mongoose.model('Partner', partnerSchema);
  