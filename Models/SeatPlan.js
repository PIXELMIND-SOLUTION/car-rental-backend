import mongoose from "mongoose";

const seatPlanSchema = new mongoose.Schema({
  seatNumber: Number,
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  roomNumber: String,
  row: String, // Row allocation (e.g., Left, Right)
});

const SeatPlan = mongoose.model("SeatPlan", seatPlanSchema);

export default SeatPlan;
