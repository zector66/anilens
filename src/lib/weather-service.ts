// Weather service using Open-Meteo API (free, no API key required)

export type WeatherCondition = 
  | 'clear' 
  | 'cloudy' 
  | 'rain' 
  | 'snow' 
  | 'thunderstorm' 
  | 'fog' 
  | 'windy';

export interface WeatherData {
  condition: WeatherCondition;
  temperature: number; // Celsius
  humidity: number;
  windSpeed: number;
  isDay: boolean;
  description: string;
  icon: string;
}

// WMO Weather interpretation codes to our conditions
const weatherCodeToCondition = (code: number, isDay: boolean): { condition: WeatherCondition; description: string; icon: string } => {
  // Clear
  if (code === 0) {
    return { 
      condition: 'clear', 
      description: isDay ? 'Clear sky' : 'Clear night',
      icon: isDay ? '☀️' : '🌙'
    };
  }
  // Mainly clear, partly cloudy
  if (code === 1 || code === 2) {
    return { 
      condition: 'clear', 
      description: 'Partly cloudy',
      icon: isDay ? '⛅' : '☁️'
    };
  }
  // Overcast
  if (code === 3) {
    return { condition: 'cloudy', description: 'Overcast', icon: '☁️' };
  }
  // Fog
  if (code === 45 || code === 48) {
    return { condition: 'fog', description: 'Foggy', icon: '🌫️' };
  }
  // Drizzle
  if (code >= 51 && code <= 57) {
    return { condition: 'rain', description: 'Drizzle', icon: '🌧️' };
  }
  // Rain
  if (code >= 61 && code <= 67) {
    return { condition: 'rain', description: 'Rain', icon: '🌧️' };
  }
  // Snow
  if (code >= 71 && code <= 77) {
    return { condition: 'snow', description: 'Snow', icon: '❄️' };
  }
  // Rain showers
  if (code >= 80 && code <= 82) {
    return { condition: 'rain', description: 'Rain showers', icon: '🌦️' };
  }
  // Snow showers
  if (code >= 85 && code <= 86) {
    return { condition: 'snow', description: 'Snow showers', icon: '🌨️' };
  }
  // Thunderstorm
  if (code >= 95 && code <= 99) {
    return { condition: 'thunderstorm', description: 'Thunderstorm', icon: '⛈️' };
  }
  
  return { condition: 'clear', description: 'Unknown', icon: '🌤️' };
};

export async function getUserLocation(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        console.log('Geolocation error:', error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  });
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    // Using Open-Meteo API - free, no API key required
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Weather API error');
    }

    const data = await response.json();
    const current = data.current;
    
    const isDay = current.is_day === 1;
    const weatherInfo = weatherCodeToCondition(current.weather_code, isDay);

    return {
      condition: weatherInfo.condition,
      temperature: Math.round(current.temperature_2m),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      isDay,
      description: weatherInfo.description,
      icon: weatherInfo.icon,
    };
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    return null;
  }
}

export async function getWeather(): Promise<WeatherData | null> {
  const location = await getUserLocation();
  if (!location) return null;
  
  return fetchWeather(location.lat, location.lon);
}
