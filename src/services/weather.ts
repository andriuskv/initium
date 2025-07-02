import type { GeneralSettings, WeatherSettings } from "types/settings";
import type { Current, Hour, Weekday } from "types/weather";
import { getRandomString } from "utils";
import { getSetting } from "./settings";
import { getTimeString, getCurrentDate, parseDateLocale, getDateLocale } from "./timeDate";
import * as localizationService from "services/localization";

function fetchWeatherWithCityName(name: string) {
  return fetchWeatherData(`q=${name}`);
}

async function fetchWeatherWithCoords() {
  const coords = await fetchCoords();

  if ("message" in coords) {
    return coords;
  }
  return fetchWeatherData(`lat=${coords.lat}&lon=${coords.lon}`);
}

function fetchWeather() {
  const { cityName, useGeo } = getSetting("weather") as WeatherSettings;

  if (useGeo) {
    return fetchWeatherWithCoords();
  }
  else if (cityName) {
    return fetchWeatherWithCityName(cityName);
  }
}

async function fetchMoreWeather({ lat, lon }: { lat: number, lon: number }, units: "C" | "F") {
  const data = await fetchWeatherData(`type=more&lat=${lat}&lon=${lon}`) as { hourly: Hour[], daily: Weekday[] };
  return parseMoreWeather(data, units);
}

function fetchCoords(): Promise<{ lat: number, lon: number } | { type: "geo", message: string }> {
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lon: coords.longitude }),
      error => {
        const locale = localizationService.getLocale();
        console.log(error);

        resolve({
          type: "geo",
          message: error.code === 1 ? locale.weather.geo_message : locale.global.generic_errro_message
        });
      },
      { enableHighAccuracy: true }
    );
  });
}

function parseMoreWeather(data: { hourly: Hour[], daily: Weekday[] }, units: "C" | "F"): { hourly: Hour[], daily: Weekday[] } {
  const hourly = data.hourly.map(item => {
    return {
      ...item,
      id: getRandomString(),
      tempC: units === "C" ? item.temperature : convertTemperature(item.temperature, "C"),
      time: getTimeString({ hours: item.hour, minutes: 0 })
    };
  });
  const daily = data.daily.map(item => ({
    ...item,
    id: getRandomString()
  }));

  return { hourly, daily };
}

function updateWeekdayLocale(weekdays: Weekday[], locale = "en") {
  const dateLocale = parseDateLocale(locale);
  const formatter = new Intl.DateTimeFormat(dateLocale, { weekday: "short" });
  const date = getCurrentDate();

  for (const day of weekdays) {
    const dayDate = new Date(date.year, date.month, date.day);
    day.weekday = formatter.format(dayDate);
    date.day += 1;
  }

  return weekdays;
}

function convertTemperature(value: number, units: "C" | "F") {
  if (units === "F") {
    return value * 1.8 + 32;
  }
  return (value - 32) / 1.8;
}

function convertWindSpeed({ value, raw }: { value: number, raw: number }, units: "m/s" | "ft/s") {
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

function fetchWeatherData(params: string) {
  const { locale } = getSetting("general") as GeneralSettings;
  const dateLocale = getDateLocale();
  const { units, speedUnits } = getSetting("weather") as WeatherSettings;

  return fetch(`${process.env.SERVER_URL}/weather?${params}&lang=${locale},${dateLocale}&units=${units},${speedUnits}`).then(res => res.json()) as Promise<{ hourly: Hour[], daily: Weekday[] } | Current>;
}

export {
  fetchWeather,
  fetchMoreWeather,
  updateWeekdayLocale,
  convertTemperature,
  convertWindSpeed
};
