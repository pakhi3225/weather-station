
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


// ---------------- ALLOWED CITIES ----------------

const CITIES = [
    { id: 'pune', name: 'Pune', state: 'Maharashtra', latitude: 18.5204, longitude: 73.8567 },
    { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', latitude: 19.0760, longitude: 72.8777 },
    { id: 'nagpur', name: 'Nagpur', state: 'Maharashtra', latitude: 21.1458, longitude: 79.0882 },
    { id: 'nashik', name: 'Nashik', state: 'Maharashtra', latitude: 19.9975, longitude: 73.7898 },
    { id: 'chhatrapati-sambhajinagar', name: 'Chhatrapati Sambhajinagar', state: 'Maharashtra', latitude: 19.8762, longitude: 75.3433 },
    { id: 'thane', name: 'Thane', state: 'Maharashtra', latitude: 19.2183, longitude: 72.9781 },
    { id: 'navi-mumbai', name: 'Navi Mumbai', state: 'Maharashtra', latitude: 19.0330, longitude: 73.0297 },
    { id: 'kolhapur', name: 'Kolhapur', state: 'Maharashtra', latitude: 16.7050, longitude: 74.2433 },
    { id: 'solapur', name: 'Solapur', state: 'Maharashtra', latitude: 17.6599, longitude: 75.9064 },
    { id: 'amravati', name: 'Amravati', state: 'Maharashtra', latitude: 20.9320, longitude: 77.7523 },
    { id: 'delhi', name: 'Delhi', state: 'Delhi', latitude: 28.6139, longitude: 77.2090 },
    { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946 },
    { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', latitude: 17.3850, longitude: 78.4867 },
    { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707 },
    { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639 },
    { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', latitude: 23.0225, longitude: 72.5714 },
    { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', latitude: 26.9124, longitude: 75.7873 },
    { id: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh', latitude: 26.8467, longitude: 80.9462 },
    { id: 'indore', name: 'Indore', state: 'Madhya Pradesh', latitude: 22.7196, longitude: 75.8577 },
    { id: 'bhopal', name: 'Bhopal', state: 'Madhya Pradesh', latitude: 23.2599, longitude: 77.4126 },
    { id: 'surat', name: 'Surat', state: 'Gujarat', latitude: 21.1702, longitude: 72.8311 },
    { id: 'vadodara', name: 'Vadodara', state: 'Gujarat', latitude: 22.3072, longitude: 73.1812 },
    { id: 'chandigarh', name: 'Chandigarh', state: 'Chandigarh', latitude: 30.7333, longitude: 76.7794 },
    { id: 'kochi', name: 'Kochi', state: 'Kerala', latitude: 9.9312, longitude: 76.2673 },
    { id: 'visakhapatnam', name: 'Visakhapatnam', state: 'Andhra Pradesh', latitude: 17.6868, longitude: 83.2185 }
];

function findCity(value) {
    if (!value) return null;

    const key = String(value).trim().toLowerCase();
    const slug = key.replace(/\s+/g, '-');

    return CITIES.find(
        c => c.id === key ||
             c.id === slug ||
             c.name.toLowerCase() === key
    ) || null;
}


// ---------------- WEATHER CONDITIONS ----------------

const WEATHER_CONDITIONS = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Rain showers',
    81: 'Moderate rain showers',
    82: 'Heavy rain showers',
    85: 'Light snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Thunderstorm with heavy hail'
};


// ---------------- HOMEPAGE ----------------

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


// ---------------- SAVE WEATHER DATA ----------------

app.post('/weather/update', async (req, res) => {
    try {
        const { temperature, humidity, status } = req.body;

        if (
            temperature === undefined ||
            humidity === undefined ||
            !status
        ) {
            return res.status(400).json({
                message: 'Please provide temperature, humidity, and status.'
            });
        }

        const newReport = new Weather({
            temperature,
            humidity,
            status
        });

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


// ---------------- CITY LIST (AUTOCOMPLETE) ----------------

app.get('/api/cities', (req, res) => {
    const q = (req.query.q || '').toString().trim().toLowerCase();

    let results = CITIES;

    if (q) {
        results = CITIES
            .filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.state.toLowerCase().includes(q)
            )
            .sort((a, b) => {
                const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
                const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;

                return aStarts - bStarts;
            });
    }

    res.json(
        results.map(c => ({
            id: c.id,
            name: c.name,
            state: c.state
        }))
    );
});


// ---------------- DEMO WEATHER API ----------------

app.get('/api/weather', async (req, res) => {
    try {
        const requested = req.query.id || req.query.city;

        if (!requested || !String(requested).trim()) {
            return res.status(400).json({
                message: 'Please provide a city.'
            });
        }

        const place = findCity(requested);

        if (!place) {
            return res.status(404).json({
                message: 'City not supported. Please choose one of the 25 listed Indian cities.'
            });
        }

        // Demo weather data
        // These are sample values, not live weather readings.
        const DEMO_WEATHER = {
            'pune': {
                temperature: 28,
                humidity: 65,
                feelsLike: 30,
                status: 'Partly cloudy',
                rainProbability: 20,
                windSpeed: 12
            },
            'mumbai': {
                temperature: 30,
                humidity: 78,
                feelsLike: 34,
                status: 'Cloudy',
                rainProbability: 35,
                windSpeed: 15
            },
            'nagpur': {
                temperature: 32,
                humidity: 55,
                feelsLike: 34,
                status: 'Clear sky',
                rainProbability: 10,
                windSpeed: 9
            },
            'nashik': {
                temperature: 27,
                humidity: 60,
                feelsLike: 28,
                status: 'Partly cloudy',
                rainProbability: 15,
                windSpeed: 10
            },
            'chhatrapati-sambhajinagar': {
                temperature: 29,
                humidity: 58,
                feelsLike: 30,
                status: 'Clear sky',
                rainProbability: 12,
                windSpeed: 11
            },
            'thane': {
                temperature: 30,
                humidity: 75,
                feelsLike: 33,
                status: 'Cloudy',
                rainProbability: 30,
                windSpeed: 13
            },
            'navi-mumbai': {
                temperature: 29,
                humidity: 77,
                feelsLike: 33,
                status: 'Partly cloudy',
                rainProbability: 25,
                windSpeed: 14
            },
            'kolhapur': {
                temperature: 27,
                humidity: 68,
                feelsLike: 29,
                status: 'Light rain',
                rainProbability: 45,
                windSpeed: 12
            },
            'solapur': {
                temperature: 31,
                humidity: 48,
                feelsLike: 32,
                status: 'Clear sky',
                rainProbability: 8,
                windSpeed: 10
            },
            'amravati': {
                temperature: 30,
                humidity: 52,
                feelsLike: 32,
                status: 'Partly cloudy',
                rainProbability: 15,
                windSpeed: 9
            },
            'delhi': {
                temperature: 29,
                humidity: 45,
                feelsLike: 30,
                status: 'Clear sky',
                rainProbability: 5,
                windSpeed: 8
            },
            'bengaluru': {
                temperature: 26,
                humidity: 65,
                feelsLike: 27,
                status: 'Partly cloudy',
                rainProbability: 20,
                windSpeed: 12
            },
            'hyderabad': {
                temperature: 30,
                humidity: 50,
                feelsLike: 31,
                status: 'Clear sky',
                rainProbability: 10,
                windSpeed: 10
            },
            'chennai': {
                temperature: 31,
                humidity: 72,
                feelsLike: 35,
                status: 'Cloudy',
                rainProbability: 25,
                windSpeed: 16
            },
            'kolkata': {
                temperature: 30,
                humidity: 75,
                feelsLike: 34,
                status: 'Cloudy',
                rainProbability: 35,
                windSpeed: 13
            },
            'ahmedabad': {
                temperature: 32,
                humidity: 45,
                feelsLike: 33,
                status: 'Clear sky',
                rainProbability: 5,
                windSpeed: 9
            },
            'jaipur': {
                temperature: 29,
                humidity: 40,
                feelsLike: 29,
                status: 'Clear sky',
                rainProbability: 5,
                windSpeed: 8
            },
            'lucknow': {
                temperature: 30,
                humidity: 55,
                feelsLike: 32,
                status: 'Partly cloudy',
                rainProbability: 15,
                windSpeed: 10
            },
            'indore': {
                temperature: 28,
                humidity: 50,
                feelsLike: 29,
                status: 'Partly cloudy',
                rainProbability: 12,
                windSpeed: 9
            },
            'bhopal': {
                temperature: 28,
                humidity: 58,
                feelsLike: 29,
                status: 'Partly cloudy',
                rainProbability: 18,
                windSpeed: 10
            },
            'surat': {
                temperature: 31,
                humidity: 70,
                feelsLike: 35,
                status: 'Cloudy',
                rainProbability: 30,
                windSpeed: 14
            },
            'vadodara': {
                temperature: 31,
                humidity: 55,
                feelsLike: 33,
                status: 'Clear sky',
                rainProbability: 10,
                windSpeed: 9
            },
            'chandigarh': {
                temperature: 27,
                humidity: 48,
                feelsLike: 27,
                status: 'Partly cloudy',
                rainProbability: 10,
                windSpeed: 8
            },
            'kochi': {
                temperature: 29,
                humidity: 80,
                feelsLike: 34,
                status: 'Cloudy',
                rainProbability: 40,
                windSpeed: 15
            },
            'visakhapatnam': {
                temperature: 30,
                humidity: 72,
                feelsLike: 34,
                status: 'Partly cloudy',
                rainProbability: 25,
                windSpeed: 14
            }
        };

        const weather = DEMO_WEATHER[place.id];

        res.json({
            id: place.id,
            location: `${place.name}, ${place.state}, India`,
            temperature: weather.temperature,
            humidity: weather.humidity,
            feelsLike: weather.feelsLike,
            status: weather.status,
            rainProbability: weather.rainProbability,
            windSpeed: weather.windSpeed,
            timestamp: new Date().toISOString(),
            fetchedAt: new Date().toISOString(),
            timezone: 'Asia/Kolkata',
            demo: true
        });

    } catch (error) {
        console.error('Demo weather error:', error.message);

        res.status(500).json({
            message: 'Unable to fetch demo weather data.',
            error: error.message
        });
    }
});


// ---------------- START SERVER ----------------

app.listen(PORT, () => {
    console.log(`Weather Station server running on port ${PORT}`);
});
