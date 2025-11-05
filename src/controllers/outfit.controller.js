const weatherService = require('../services/weather.service');
const outfitService = require('../services/outfit.service');

/**
 * Get outfit suggestion based on city
 * @route POST /api/outfit/suggest
 * @access Public
 */
exports.getSuggestionByCity = async (req, res) => {
  try {
    const { city } = req.body;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: 'City name is required'
      });
    }

    // Get weather data
    const weather = await weatherService.getWeatherByCity(city);

    // Generate outfit suggestion
    const outfit = outfitService.suggestOutfit(weather);

    res.status(200).json({
      success: true,
      message: 'Outfit suggestion generated successfully',
      data: {
        weather: {
          city: weather.city,
          country: weather.country,
          temperature: weather.temperature,
          feelsLike: weather.feelsLike,
          skyCondition: weather.skyCondition,
          description: weather.description,
          humidity: weather.humidity,
          windSpeed: weather.windSpeed
        },
        outfit: outfit
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating outfit suggestion',
      error: error.message
    });
  }
};

/**
 * Get outfit suggestion based on coordinates
 * @route POST /api/outfit/suggest-by-location
 * @access Public
 */
exports.getSuggestionByCoordinates = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }

    // Get weather data
    const weather = await weatherService.getWeatherByCoordinates(latitude, longitude);

    // Generate outfit suggestion
    const outfit = outfitService.suggestOutfit(weather);

    res.status(200).json({
      success: true,
      message: 'Outfit suggestion generated successfully',
      data: {
        weather: {
          city: weather.city,
          country: weather.country,
          temperature: weather.temperature,
          feelsLike: weather.feelsLike,
          skyCondition: weather.skyCondition,
          description: weather.description,
          humidity: weather.humidity,
          windSpeed: weather.windSpeed
        },
        outfit: outfit
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating outfit suggestion',
      error: error.message
    });
  }
};

/**
 * Get current weather for a city
 * @route GET /api/outfit/weather/:city
 * @access Public
 */
exports.getWeather = async (req, res) => {
  try {
    const { city } = req.params;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: 'City name is required'
      });
    }

    const weather = await weatherService.getWeatherByCity(city);

    res.status(200).json({
      success: true,
      message: 'Weather data retrieved successfully',
      data: weather
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching weather data',
      error: error.message
    });
  }
};
