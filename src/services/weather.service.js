const axios = require('axios');

class WeatherService {
  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY;
    this.apiUrl = process.env.WEATHER_API_URL;
  }

  /**
   * Get weather data by city name
   * @param {string} city - City name (e.g., "London", "New York")
   * @returns {Promise<Object>} Weather data with temperature, conditions, etc.
   */
  async getWeatherByCity(city) {
    try {
      const response = await axios.get(`${this.apiUrl}/current.json`, {
        params: {
          key: this.apiKey,
          q: city,
          aqi: 'no'
        }
      });

      return this.formatWeatherData(response.data);
    } catch (error) {
      throw new Error(`Failed to fetch weather data: ${error.message}`);
    }
  }

  /**
   * Get weather data by coordinates
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {Promise<Object>} Weather data with temperature, conditions, etc.
   */
  async getWeatherByCoordinates(latitude, longitude) {
    try {
      const response = await axios.get(`${this.apiUrl}/current.json`, {
        params: {
          key: this.apiKey,
          q: `${latitude},${longitude}`,
          aqi: 'no'
        }
      });

      return this.formatWeatherData(response.data);
    } catch (error) {
      throw new Error(`Failed to fetch weather data: ${error.message}`);
    }
  }

  /**
   * Format raw weather data from WeatherAPI.com
   * @param {Object} data - Raw weather data from WeatherAPI
   * @returns {Object} Formatted weather data
   */
  formatWeatherData(data) {
    const { location, current } = data;

    // Map WeatherAPI condition text to simple categories
    const conditionText = current.condition.text.toLowerCase();
    let skyCondition = 'Clear';

    if (conditionText.includes('rain') || conditionText.includes('drizzle') || conditionText.includes('shower')) {
      skyCondition = 'Rain';
    } else if (conditionText.includes('snow') || conditionText.includes('sleet') || conditionText.includes('blizzard')) {
      skyCondition = 'Snow';
    } else if (conditionText.includes('thunder') || conditionText.includes('storm')) {
      skyCondition = 'Thunderstorm';
    } else if (conditionText.includes('cloud') || conditionText.includes('overcast')) {
      skyCondition = 'Clouds';
    } else if (conditionText.includes('mist') || conditionText.includes('fog')) {
      skyCondition = 'Mist';
    } else if (conditionText.includes('clear') || conditionText.includes('sunny')) {
      skyCondition = 'Clear';
    }

    return {
      city: location.name,
      country: location.country,
      temperature: Math.round(current.temp_f), // Fahrenheit
      feelsLike: Math.round(current.feelslike_f),
      tempMin: Math.round(current.temp_f), // WeatherAPI doesn't provide min/max in current
      tempMax: Math.round(current.temp_f),
      humidity: current.humidity,
      pressure: current.pressure_mb,
      skyCondition: skyCondition,
      description: current.condition.text,
      icon: current.condition.icon,
      windSpeed: current.wind_mph,
      windDirection: current.wind_degree,
      cloudiness: current.cloud,
      timestamp: new Date(current.last_updated_epoch * 1000),
      sunrise: null, // Not available in current endpoint
      sunset: null
    };
  }
}

module.exports = new WeatherService();
