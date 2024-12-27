import mongoose from 'mongoose';

// Certificate Schema
const certificateSchema = new mongoose.Schema(
  {
    certificateName: { type: String, required: true }, // Certificate Name
    headerLeftText: { type: String }, // Text on the left side of the header
    date: { type: Date, default: Date.now }, // Certificate issue date
    body: { type: String, maxlength: 500 }, // Body of the certificate
    bodyFont: { type: String, default: 'Arial' }, // Font for the body text
    fontSize: { type: String, default: '2em' }, // Font size for the body text
    footerLeftText: { type: String }, // Footer left text
    footerCenterText: { type: String }, // Footer center text
    footerRightText: { type: String }, // Footer right text
    pageLayout: { type: String, default: 'A4 (Portrait)' }, // Page layout
    height: { type: Number }, // Height in mm
    width: { type: Number }, // Width in mm
    studentPhoto: { type: String, enum: ['Yes', 'None'], default: 'None' }, // Student photo option
  },
  { timestamps: true }
);

const CertificateModel = mongoose.model('Certificate', certificateSchema);
export default CertificateModel
