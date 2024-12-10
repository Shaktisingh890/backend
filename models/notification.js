import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['reminder', 'alert', 'update'], required: true },
    message: { type: String, required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['unread', 'read'], default: 'unread' },
  });
  
  export const Notification = mongoose.model('Notification', notificationSchema);
  