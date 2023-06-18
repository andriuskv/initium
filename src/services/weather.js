import { getRandomString } from "../utils";
import { getSetting } from "./settings";
import { getTimeString } from "./timeDate";

async function fetchWeatherWithCityName(name) {
  return fetchWeatherData(`q=${name}`);
}

async function fetchWeatherWithCoords() {
  const coords = await fetchCoords();

  if (coords.message) {
    return coords;
  }
  return fetchWeatherData(`lat=${coords.lat}&lon=${coords.lon}`);
}

async function fetchWeather() {
  const { cityName, useGeo } = getSetting("weather");

  if (useGeo) {
    return fetchWeatherWithCoords();
  }
  else if (cityName) {
    return fetchWeatherWithCityName(cityName);
  }
}

async function fetchMoreWeather({ lat, lon }) {
  const data = await fetchWeatherData(`type=more&lat=${lat}&lon=${lon}`);
  const hourly = data.hourly.map(item => ({
    ...item,
    id: getRandomString(),
    time: getTimeString({ hours: item.hour })
  }));
  const daily = data.daily.map(item => ({
    ...item,
    id: getRandomString()
  }));

  return { hourly, daily };
}

function fetchCoords() {
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lon: coords.longitude }),
      error => {
        console.log(error);

        resolve({
          type: "geo",
          message: error.code === 1 ? "Access to geolocation is not permitted." : "Something went wrong."
        });
      },
      { enableHighAccuracy: true }
    );
  });
}

function convertTemperature(value, units) {
  if (units === "F") {
    value = value * 1.8 + 32;
  }
  else {
    value = (value - 32) / 1.8;
  }
  return value;
}

function convertWindSpeed(value, units) {
  if (units === "m/s") {
    value = value * 0.3048;
  }
  else {
    value = value / 0.3048;
  }
  return value;
}

function fetchWeatherData(params) {
  const { units, speedUnits } = getSetting("weather");
  return fetch(`${process.env.SERVER_URL}/owm?${params}&units=${units},${speedUnits}`).then(res => res.json());
}

export {
  fetchWeather,
  fetchMoreWeather,
  convertTemperature,
  convertWindSpeed
};
