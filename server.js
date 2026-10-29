// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// Use Render's port when deployed, otherwise use 3000 locally
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files from the project folder
app.use(express.static(path.join(__dirname)));


// ---------------- MONGODB ATLAS CONNECTION ----------------

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
    res.sendFile(path.join(__dirname, 'index.html'));
});


// ---------------- SAVE WEATHER DATA ----------------

app.post('/weather/update', async (req, res) => {
    try {
        const { temperature, humidity, status } = req.body;

        // Validate data
        if (
            temperature === undefined ||
            humidity === undefined ||
            !status
        ) {
            return res.status(400).json({
                message: 'Please provide temperature, humidity, and status.'
            });
        }

        // Create weather report
        const newReport = new Weather({
            temperature,
            humidity,
            status
        });

        // Save to MongoDB Atlas
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


// ---------------- SERVER STATUS ----------------

app.get('/health', (req, res) => {
    res.status(200).json({
        message: 'Weather Station server is running!',
        database:
            mongoose.connection.readyState === 1
                ? 'Connected'
                : 'Disconnected'
    });
});


// ---------------- START SERVER ----------------

app.listen(PORT, () => {
    console.log(`Weather Station server running on port ${PORT}`);
});