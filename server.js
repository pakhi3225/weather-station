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

// NOTE: express.static(__dirname) was removed on purpose. It exposed every file
// in the project folder (including .env and server.js) to the public.
// The dashboard is a single self-contained page served by the "/" route below.


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
// Fixed list of supported cities with exact coordinates, so the weather
// always belongs to the city the user picked (no geocoding guesswork).

const CITIES = [
    { id: 'pune',                      name: 'Pune',                       state: 'Maharashtra',    latitude: 18.5204, longitude: 73.8567 },
    { id: 'mumbai',                    name: 'Mumbai',                     state: 'Maharashtra',    latitude: 19.0760, longitude: 72.8777 },
    { id: 'nagpur',                    name: 'Nagpur',                     state: 'Maharashtra',    latitude: 21.1458, longitude: 79.0882 },
    { id: 'nashik',                    name: 'Nashik',                     state: 'Maharashtra',    latitude: 19.9975, longitude: 73.7898 },
    { id: 'chhatrapati-sambhajinagar', name: 'Chhatrapati Sambhajinagar',  state: 'Maharashtra',    latitude: 19.8762, longitude: 75.3433 },
    { id: 'thane',                     name: 'Thane',                      state: 'Maharashtra',    latitude: 19.2183, longitude: 72.9781 },
    { id: 'navi-mumbai',               name: 'Navi Mumbai',                state: 'Maharashtra',    latitude: 19.0330, longitude: 73.0297 },
    { id: 'kolhapur',                  name: 'Kolhapur',                   state: 'Maharashtra',    latitude: 16.7050, longitude: 74.2433 },
    { id: 'solapur',                   name: 'Solapur',                    state: 'Maharashtra',    latitude: 17.6599, longitude: 75.9064 },
    { id: 'amravati',                  name: 'Amravati',                   state: 'Maharashtra',    latitude: 20.9320, longitude: 77.7523 },
    { id: 'delhi',                     name: 'Delhi',                      state: 'Delhi',          latitude: 28.6139, longitude: 77.2090 },
    { id: 'bengaluru',                 name: 'Bengaluru',                  state: 'Karnataka',      latitude: 12.9716, longitude: 77.5946 },
    { id: 'hyderabad',                 name: 'Hyderabad',                  state: 'Telangana',      latitude: 17.3850, longitude: 78.4867 },
    { id: 'chennai',                   name: 'Chennai',                    state: 'Tamil Nadu',     latitude: 13.0827, longitude: 80.2707 },
    { id: 'kolkata',                   name: 'Kolkata',                    state: 'West Bengal',    latitude: 22.5726, longitude: 88.3639 },
    { id: 'ahmedabad',                 name: 'Ahmedabad',                  state: 'Gujarat',        latitude: 23.0225, longitude: 72.5714 },
    { id: 'jaipur',                    name: 'Jaipur',                     state: 'Rajasthan',      latitude: 26.9124, longitude: 75.7873 },
    { id: 'lucknow',                   name: 'Lucknow',                    state: 'Uttar Pradesh',  latitude: 26.8467, longitude: 80.9462 },
    { id: 'indore',                    name: 'Indore',                     state: 'Madhya Pradesh', latitude: 22.7196, longitude: 75.8577 },
    { id: 'bhopal',                    name: 'Bhopal',                     state: 'Madhya Pradesh', latitude: 23.2599, longitude: 77.4126 },
    { id: 'surat',                     name: 'Surat',                      state: 'Gujarat',        latitude: 21.1702, longitude: 72.8311 },
    { id: 'vadodara',                  name: 'Vadodara',                   state: 'Gujarat',        latitude: 22.3072, longitude: 73.1812 },
    { id: 'chandigarh',                name: 'Chandigarh',                 state: 'Chandigarh',     latitude: 30.7333, longitude: 76.7794 },
    { id: 'kochi',                     name: 'Kochi',                      state: 'Kerala',         latitude:  9.9312, longitude: 76.2673 },
    { id: 'visakhapatnam',             name: 'Visakhapatnam',              state: 'Andhra Pradesh', latitude: 17.6868, longitude: 83.2185 }
];

function findCity(value) {
    if (!value) return null;
    const key = String(value).trim().toLowerCase();
    const slug = key.replace(/\s+/g, '-');
    return CITIES.find(c => c.id === key || c.id === slug || c.name.toLowerCase() === key) || null;
}

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


// ---------------- CITY LIST (AUTOCOMPLETE) ----------------
// Returns the allowed cities. Optional ?q= filters by city or state name.

app.get('/api/cities', (req, res) => {
    const q = (req.query.q || '').toString().trim().toLowerCase();

    let results = CITIES;
    if (q) {
        results = CITIES
            .filter(c => c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q))
            .sort((a, b) => {
                const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
                const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;
                return aStarts - bStarts;
            });
    }

    res.json(results.map(c => ({ id: c.id, name: c.name, state: c.state })));
});


// ---------------- LIVE WEATHER API ----------------
// Usage: /api/weather?id=pune   (preferred, from the autocomplete)
//        /api/weather?city=Pune (also accepted)

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

        // Fetch live weather for the exact coordinates of the chosen city
        const url =
            'https://api.open-meteo.com/v1/forecast' +
            `?latitude=${place.latitude}&longitude=${place.longitude}` +
            '&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m' +
            '&hourly=precipitation_probability' +
            '&forecast_days=1&timezone=Asia%2FKolkata';

        const weatherResponse = await fetch(url, { signal: AbortSignal.timeout(10000) });

        if (!weatherResponse.ok) {
            throw new Error('Weather service returned an error.');
        }

        const weatherData = await weatherResponse.json();
        const current = weatherData.current;

        if (!current) {
            throw new Error('Weather service returned no current data.');
        }

        // Find the precipitation probability for the current hour
        const currentHour = current.time.slice(0, 13);
        const hourlyTimes = (weatherData.hourly && weatherData.hourly.time) || [];
        const hourlyIndex = hourlyTimes.findIndex(
            time => time.slice(0, 13) === currentHour
        );

        const rainProbability =
            hourlyIndex >= 0
                ? weatherData.hourly.precipitation_probability[hourlyIndex]
                : 0;

        res.json({
            id: place.id,
            location: `${place.name}, ${place.state}, India`,
            temperature: current.temperature_2m,
            humidity: current.relative_humidity_2m,
            feelsLike: current.apparent_temperature,
            status: WEATHER_CONDITIONS[current.weather_code] || 'Unknown',
            rainProbability: rainProbability,
            windSpeed: current.wind_speed_10m,
            timestamp: current.time,
            fetchedAt: new Date().toISOString(),
            timezone: weatherData.timezone
        });

    } catch (error) {
        console.error('Live weather error:', error.message);

        const timedOut = error.name === 'TimeoutError' || error.name === 'AbortError';

        res.status(timedOut ? 504 : 500).json({
            message: timedOut
                ? 'The weather service took too long to respond. Please try again.'
                : 'Unable to fetch live weather right now.',
            error: error.message
        });
    }
});


// ---------------- START SERVER ----------------

app.listen(PORT, () => {
    console.log(`Weather Station server running on port ${PORT}`);
});