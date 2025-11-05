require('dotenv').config();
const axios = require('axios');

async function testWeatherAPI() {
  const apiKey = process.env.WEATHER_API_KEY;
  const apiUrl = process.env.WEATHER_API_URL;

  console.log('Testing WeatherAPI.com...');
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT FOUND');
  console.log('API URL:', apiUrl);
  console.log('');

  try {
    const response = await axios.get(`${apiUrl}/current.json`, {
      params: {
        key: apiKey,
        q: 'New York',
        aqi: 'no'
      }
    });

    console.log('✓ SUCCESS! API is working correctly');
    console.log('');
    console.log('Location:', response.data.location.name, ',', response.data.location.country);
    console.log('Temperature:', response.data.current.temp_f, '°F');
    console.log('Feels Like:', response.data.current.feelslike_f, '°F');
    console.log('Condition:', response.data.current.condition.text);
    console.log('Humidity:', response.data.current.humidity, '%');
    console.log('Wind:', response.data.current.wind_mph, 'mph');
    console.log('');
    console.log('✓ Weather service is ready to use!');
  } catch (error) {
    console.error('✗ ERROR! API request failed');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.error?.message || error.message);
    console.error('');

    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('This is an authentication error. Possible causes:');
      console.log('1. API key is incorrect');
      console.log('2. API key format is invalid');
      console.log('');
      console.log('Please check:');
      console.log('- Visit https://www.weatherapi.com/my/');
      console.log('- Verify your API key is correct');
    }
  }
}

testWeatherAPI();
