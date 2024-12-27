// Library Schema
import mongoose from "mongoose";
const bookSchema = new mongoose.Schema({
    title: { type: String },
    author: { type: String },
    isbn: { type: String, unique: true },
    copiesAvailable: { type: Number },
    issuedTo: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
        issueDate: { type: Date },
        returnDate: { type: Date }
      }
    ],
    role: { type: String, default: 'Admin' }
  }, { timestamps: true });
  
  const Book = mongoose.model('Book', bookSchema);
  export default Book