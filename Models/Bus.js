import mongoose from "mongoose";

const BusSchema = new mongoose.Schema({
    busNumber: { type: String,},
    currentLocation: {
        lat: { type: Number, },
        lng: { type: Number, }
    },
    route: [
        {
            stopName: { type: String, },
            lat: { type: Number, },
            lng: { type: Number, },
            arrivalTime: { type: String, }
        }
    ]
});

const Bus = mongoose.model("Bus", BusSchema);
export default Bus
