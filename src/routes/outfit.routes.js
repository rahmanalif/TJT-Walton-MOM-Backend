const express = require('express');
const router = express.Router();
const {
  getSuggestionByCity,
  getSuggestionByCoordinates,
  getWeather
} = require('../controllers/outfit.controller');

// Public routes - no authentication required

/**
 * @route   POST /api/outfit/suggest
 * @desc    Get outfit suggestion based on city name
 * @access  Public
 * @body    { city: string }
 */
router.post('/suggest', getSuggestionByCity);

/**
 * @route   POST /api/outfit/suggest-by-location
 * @desc    Get outfit suggestion based on coordinates
 * @access  Public
 * @body    { latitude: number, longitude: number }
 */
router.post('/suggest-by-location', getSuggestionByCoordinates);

/**
 * @route   GET /api/outfit/weather/:city
 * @desc    Get current weather data for a city
 * @access  Public
 */
router.get('/weather/:city', getWeather);

module.exports = router;
