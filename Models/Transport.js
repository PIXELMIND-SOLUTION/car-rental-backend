import mongoose from 'mongoose';

const transportRouteSchema = new mongoose.Schema({
  routeTitle: {
    type: String,
  },
  fare: {
    type: Number,
  },
  transportType: { type: String }, 
  route: { type: String },          
  pickupTime: { type: String },     
  dropTime: { type: String },       
  vehicle: { type: String },       
  driver: { 
    name: { type: String },         
    contact: { type: String }
  },
}, { timestamps: true });

const Transport = mongoose.model('Transport', transportRouteSchema);

export default Transport;
