import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  city: { type: String },
  zip: { type: String },
  address: { type: String },
  email: { type: String, unique: true }
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);
export default Order;
