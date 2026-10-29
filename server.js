// Load environment variables from .env
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

// Middleware to read JSON data
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB Atlas successfully!');
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error.message);
    });


// ---------------- WEATHER SCHEMA ----------------

const weatherSchema = new mongoose.Schema({
    temperature: {
        type: Number,
        required: true
    },

    humidity: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        required: true
    },

    timestamp: {
        type: Date,
        default: Date.now
    }
});


// ---------------- WEATHER MODEL ----------------

const Weather = mongoose.model('Weather', weatherSchema);


// ---------------- HOMEPAGE ----------------

app.get('/', (req, res) => {
    res.send(`
        <h1>Weather Station API</h1>
        <p>Server is running successfully!</p>

        <h3>Available API Routes</h3>
        <ul>
            <li>GET /weather/now - View the latest weather data</li>
            <li>POST /weather/update - Save new weather data</li>
            <li>GET /weather/all - View all weather records</li>
        </ul>
    `);
});


// ---------------- SAVE WEATHER DATA ----------------

app.post('/weather/update', async (req, res) => {
    try {
        const { temperature, humidity, status } = req.body;

        // Validate the required fields
        if (
            temperature === undefined ||
            humidity === undefined ||
            !status
        ) {
            return res.status(400).json({
                message: 'Please provide temperature, humidity, and status.'
            });
        }

        // Create a new weather report
        const newReport = new Weather({
            temperature,
            humidity,
            status
        });

        // Save the report to MongoDB Atlas
        const savedReport = await newReport.save();

        res.status(201).json({
            message: 'Weather data saved successfully!',
            data: savedReport
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to save weather data.',
            error: error.message
        });
    }
});


// ---------------- GET LATEST WEATHER DATA ----------------

app.get('/weather/now', async (req, res) => {
    try {
        const latestWeather = await Weather.findOne()
            .sort({ timestamp: -1 });

        if (!latestWeather) {
            return res.status(404).json({
                message: 'No weather data found yet.'
            });
        }

        res.status(200).json(latestWeather);

    } catch (error) {
        res.status(500).json({
            message: 'Failed to retrieve weather data.',
            error: error.message
        });
    }
});


// ---------------- GET ALL WEATHER RECORDS ----------------

app.get('/weather/all', async (req, res) => {
    try {
        const records = await Weather.find()
            .sort({ timestamp: -1 });

        res.status(200).json(records);

    } catch (error) {
        res.status(500).json({
            message: 'Failed to retrieve weather records.',
            error: error.message
        });
    }
});


// ---------------- START SERVER ----------------

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});