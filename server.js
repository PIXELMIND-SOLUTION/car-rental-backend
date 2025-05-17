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


dotenv.config();





const app = express();

// ✅ Serve static files from /uploads
app.use(cors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// Database connection
connectDatabase();


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

// Serve frontend static files (HTML, JS, CSS)


// Create HTTP server with Express app
const server = http.createServer(app);

app.use('/api/users', UserRoutes);
app.use('/api/staff', staffRoutes); // Prefix all staff-related routes with /api/staff
app.use('/api/car', carRoutes); // Prefix with '/api'




// Start the server
const port = process.env.PORT || 6000;
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
