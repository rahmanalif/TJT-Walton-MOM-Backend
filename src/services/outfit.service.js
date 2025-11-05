class OutfitService {
  /**
   * Generate outfit suggestion based on weather conditions
   * @param {Object} weather - Weather data object
   * @returns {Object} Outfit suggestion with clothing recommendations
   */
  suggestOutfit(weather) {
    const { temperature, skyCondition, feelsLike, windSpeed } = weather;

    // Use feels-like temperature for more accurate suggestions
    const effectiveTemp = feelsLike || temperature;

    const outfit = {
      temperature: temperature,
      skyCondition: skyCondition,
      layers: [],
      accessories: [],
      footwear: [],
      additionalTips: []
    };

    // Temperature-based clothing suggestions
    if (effectiveTemp <= 32) {
      // Freezing (32°F and below)
      outfit.layers = ['Heavy winter coat or parka', 'Thick sweater or fleece', 'Thermal underlayer', 'Long pants or jeans'];
      outfit.accessories = ['Winter hat/beanie', 'Scarf', 'Gloves', 'Warm socks'];
      outfit.footwear = ['Insulated boots', 'Winter boots'];
      outfit.additionalTips.push('Dress in layers to trap heat');
      outfit.additionalTips.push('Cover exposed skin to prevent frostbite');
    } else if (effectiveTemp <= 45) {
      // Cold (33-45°F)
      outfit.layers = ['Heavy jacket or coat', 'Sweater or hoodie', 'Long-sleeve shirt', 'Long pants'];
      outfit.accessories = ['Light scarf', 'Gloves (optional)', 'Warm socks'];
      outfit.footwear = ['Boots', 'Closed-toe shoes'];
      outfit.additionalTips.push('Layer up - you can always remove layers if needed');
    } else if (effectiveTemp <= 55) {
      // Cool (46-55°F)
      outfit.layers = ['Light jacket or cardigan', 'Long-sleeve shirt or light sweater', 'Long pants or jeans'];
      outfit.accessories = ['Light scarf (optional)'];
      outfit.footwear = ['Sneakers', 'Casual shoes', 'Boots'];
      outfit.additionalTips.push('Perfect weather for layering');
    } else if (effectiveTemp <= 65) {
      // Mild (56-65°F)
      outfit.layers = ['Light jacket or sweater (recommended)', 'Long-sleeve shirt or t-shirt', 'Long pants, jeans, or light skirt'];
      outfit.accessories = [];
      outfit.footwear = ['Sneakers', 'Casual shoes', 'Loafers'];
      outfit.additionalTips.push('Light jacket or sweater recommended for comfort');
    } else if (effectiveTemp <= 75) {
      // Comfortable (66-75°F)
      outfit.layers = ['T-shirt or short-sleeve shirt', 'Light pants, jeans, shorts, or skirt'];
      outfit.accessories = ['Sunglasses (if sunny)'];
      outfit.footwear = ['Sneakers', 'Casual shoes', 'Sandals'];
      outfit.additionalTips.push('Comfortable temperature - dress casually');
    } else if (effectiveTemp <= 85) {
      // Warm (76-85°F)
      outfit.layers = ['Light, breathable t-shirt or tank top', 'Shorts, light skirt, or light pants'];
      outfit.accessories = ['Sunglasses', 'Sunhat (recommended)', 'Sunscreen'];
      outfit.footwear = ['Sandals', 'Light sneakers'];
      outfit.additionalTips.push('Wear light, breathable fabrics');
      outfit.additionalTips.push('Stay hydrated');
    } else {
      // Hot (86°F and above)
      outfit.layers = ['Light, breathable clothing', 'Tank top or sleeveless shirt', 'Shorts or light skirt'];
      outfit.accessories = ['Sunglasses', 'Wide-brimmed hat', 'Sunscreen (essential)'];
      outfit.footwear = ['Sandals', 'Flip-flops'];
      outfit.additionalTips.push('Wear loose, light-colored, breathable fabrics');
      outfit.additionalTips.push('Stay hydrated and seek shade when possible');
      outfit.additionalTips.push('Limit outdoor activities during peak heat hours');
    }

    // Sky condition adjustments
    switch (skyCondition.toLowerCase()) {
      case 'rain':
      case 'drizzle':
      case 'thunderstorm':
        outfit.accessories.push('Umbrella (essential)');
        outfit.accessories.push('Rain jacket or waterproof coat');
        outfit.footwear = ['Waterproof boots', 'Rain boots'];
        outfit.additionalTips.push('Bring waterproof gear');
        break;

      case 'snow':
        outfit.accessories.push('Waterproof winter coat');
        outfit.accessories.push('Waterproof gloves');
        outfit.footwear = ['Waterproof winter boots'];
        outfit.additionalTips.push('Dress warmly and wear waterproof clothing');
        break;

      case 'clear':
        if (effectiveTemp > 65) {
          outfit.accessories.push('Sunglasses');
          outfit.additionalTips.push('Apply sunscreen - clear skies mean strong UV rays');
        }
        break;

      case 'clouds':
      case 'mist':
      case 'fog':
        if (effectiveTemp < 60) {
          outfit.additionalTips.push('Cloudy weather can feel cooler than the temperature suggests');
        }
        break;
    }

    // Wind adjustments
    if (windSpeed > 15) {
      outfit.additionalTips.push('Strong winds - wear wind-resistant outer layer');
      if (!outfit.accessories.includes('Hat') && effectiveTemp < 60) {
        outfit.accessories.push('Secure hat or beanie');
      }
    }

    // Generate summary
    outfit.summary = this.generateSummary(weather, outfit);

    return outfit;
  }

  /**
   * Generate a human-readable summary of the outfit suggestion
   * @param {Object} weather - Weather data
   * @param {Object} outfit - Outfit suggestion
   * @returns {string} Summary text
   */
  generateSummary(weather, outfit) {
    const { temperature, skyCondition, city } = weather;
    const mainLayer = outfit.layers[0] || 'comfortable clothing';

    let summary = `It's ${temperature}°F with ${skyCondition.toLowerCase()} skies in ${city}. `;

    if (temperature <= 45) {
      summary += `It's quite cold outside. ${mainLayer} is recommended to stay warm.`;
    } else if (temperature <= 65) {
      summary += `${mainLayer} is recommended for comfort.`;
    } else if (temperature <= 75) {
      summary += `The weather is comfortable. Dress casually with ${mainLayer.toLowerCase()}.`;
    } else {
      summary += `It's warm outside. Wear light, breathable clothing to stay cool.`;
    }

    return summary;
  }

  /**
   * Get outfit category based on temperature
   * @param {number} temperature - Temperature in Fahrenheit
   * @returns {string} Category name
   */
  getTemperatureCategory(temperature) {
    if (temperature <= 32) return 'Freezing';
    if (temperature <= 45) return 'Cold';
    if (temperature <= 55) return 'Cool';
    if (temperature <= 65) return 'Mild';
    if (temperature <= 75) return 'Comfortable';
    if (temperature <= 85) return 'Warm';
    return 'Hot';
  }
}

module.exports = new OutfitService();
