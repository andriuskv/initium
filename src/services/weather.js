import { getRandomString } from "../utils";
import { getSetting } from "./settings";
import { getTimeString, getCurrentDate } from "./timeDate";

function fetchWeatherWithCityName(name) {
  return fetchWeatherData(`q=${name}`);
}

async function fetchWeatherWithCoords() {
  const coords = await fetchCoords();

  if (coords.message) {
    return coords;
  }
  return fetchWeatherData(`lat=${coords.lat}&lon=${coords.lon}`);
}

function fetchWeather() {
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
  return parseWeather(data);
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

function parseWeather(data) {
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

function updateWeekdayLocale(weekdays, locale = "en") {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const date = getCurrentDate();

  for (const day of weekdays) {
    const dayDate = new Date(date.year, date.month, date.day);
    day.weekday = formatter.format(dayDate);
    date.day += 1;
  }

  return weekdays;
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

function convertWindSpeed({ value, raw }, units) {
  if (units === "m/s") {
    value = raw * 0.3048;
  }
  else {
    value = raw / 0.3048;
  }
  return {
    value: Math.round(value),
    raw: value
  };
}

function fetchWeatherData(params) {
  const { dateLocale } = getSetting("timeDate");
  const { units, speedUnits } = getSetting("weather");
  return fetch(`${process.env.SERVER_URL}/weather?${params}&lang=en,${dateLocale}&units=${units},${speedUnits}`).then(res => res.json());
}

export {
  fetchWeather,
  fetchMoreWeather,
  updateWeekdayLocale,
  convertTemperature,
  convertWindSpeed
};
