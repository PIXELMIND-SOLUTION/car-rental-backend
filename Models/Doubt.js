import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const doubtSchema = new Schema({
  doubtText: { type: String, required: true },
  askedBy: { type: Schema.Types.ObjectId, ref: 'Student', }, // Student asking the doubt
  askedTo: { type: Schema.Types.ObjectId, ref: 'Student', }, // Student answering the doubt
  subject: { type: String, }, // Change subject to String
  createdAt: { type: Date, default: Date.now },
});

const Doubt = model('Doubt', doubtSchema);

export default Doubt;
