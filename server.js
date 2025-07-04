import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDatabase from './db/connectDatabase.js';
import UserRoutes from './Routes/userRoutes.js'
import staffRoutes from './Routes/staffRoutes.js'
import carRoutes from './Routes/carRoutes.js'
import AdminRoutes from './Routes/adminRoutes.js'
import fileUpload from 'express-fileupload';
import path from 'path'
import { fileURLToPath } from 'url';




dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const app = express();


// ✅ Serve static files from /uploads
app.use(cors({
    origin: ['http://localhost:3000', 'http://194.164.148.244:7650'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// Database connection
connectDatabase();


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Default route
app.get("/", (req, res) => {
    res.json({
        status: "success",    // A key to indicate the response status
        message: "Welcome to our service!", // Static message
    });
});


// Get the directory name for the current file (equivalent of __dirname in CommonJS)

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/', // or './tmp' or any other folder
}));

// Serve frontend static files (HTML, JS, CSS)


// Create HTTP server with Express app
const server = http.createServer(app);

app.use('/api/admin', AdminRoutes);
app.use('/api/users', UserRoutes);
app.use('/api/staff', staffRoutes); // Prefix all staff-related routes with /api/staff
app.use('/api/car', carRoutes); // Prefix with '/api'




const port = process.env.PORT || 6061;

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${port}`);
});

