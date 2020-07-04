import { Injectable } from "@angular/core";
import { capitalizeString, convertTemperature } from "../utils/utils";
import { TimeDateService } from "./timeDateService";

@Injectable({
    providedIn: "root"
})
export class WeatherService {
    constructor(private timeDateService: TimeDateService) {}

    fetchWeather(params) {
        return fetch(`${process.env.SERVER_URL}/owm?${params}`).then(res => res.json());
    }

    fetchHourlyWeather({ lat, lon }) {
        return this.fetchWeather(`type=hourly&lat=${lat}&lon=${lon}`);
    }

    getWeatherWithCityName(name) {
        return this.fetchWeather(`q=${name}`);
    }

    getCoords() {
        return new Promise(resolve => {
            navigator.geolocation.getCurrentPosition(
                ({ coords }) => resolve({ lat: coords.latitude, lon: coords.longitude }),
                error => {
                    console.log(error);

                    if (error.code === 1) {
                        resolve({
                            name: "weather",
                            type: "geo",
                            message: "Access to geolocation is not permitted."
                        });
                    }
                },
                { enableHighAccuracy: true });
        });
    }

    getWeatherWithCoords({ lat, lon }) {
        return this.fetchWeather(`lat=${lat}&lon=${lon}`);
    }

    getWindDirection(degrees) {
        let name = "";

        if (degrees > 337.5 && degrees <= 22.5) {
            name = "N";
        }
        else if (degrees > 22.5 && degrees <= 67.5) {
            name = "NE";
        }
        else if (degrees > 67.5 && degrees <= 112.5) {
            name = "E";
        }
        else if (degrees > 112.5 && degrees <= 157.5) {
            name = "SE";
        }
        else if (degrees > 157.5 && degrees <= 202.5) {
            name = "S";
        }
        else if (degrees > 202.5 && degrees <= 247.5) {
            name = "SW";
        }
        else if (degrees > 247.5 && degrees <= 292.5) {
            name = "W";
        }
        else {
            name = "NW";
        }
        return { name, degrees };
    }

    parseWeather(data, units) {
        const [weather] = data.weather;

        return {
            city: data.name,
            temperature: units === "C" ?
                Math.round(data.main.temp) :
                convertTemperature(data.main.temp, units),
            humidity: data.main.humidity,
            description: capitalizeString(weather.description),
            coords: data.coord,
            wind: {
                speed: data.wind.speed,
                direction: this.getWindDirection(data.wind.deg),
            },
            icon: `http://openweathermap.org/img/wn/${weather.icon}@2x.png`
        };
    }

    async getHourlyWeather({ coords, units, timeFormat }) {
        try {
            const data = await this.fetchHourlyWeather(coords);

            return data.hourly.map(item => {
                const forecastHours = new Date(item.dt * 1000).getHours();
                const { hours, period } = this.timeDateService.getTime({ hours: forecastHours }, timeFormat);

                return {
                    forecastHours,
                    time: `${hours}:00${period ? ` ${period}` : ""}`,
                    temperature: units === "C" ?
                        Math.round(item.temp) :
                        convertTemperature(item.temp, units),
                    icon: `http://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`
                };
            });
        } catch (e) {
            console.log(e);
        }
    }

    async getWeather({ cityName, useGeo, units }) {
        if (useGeo) {
            const coords: any = await this.getCoords();

            if (coords.message) {
                return coords;
            }
            const data = await this.getWeatherWithCoords(coords);
            return this.parseWeather(data, units);
        }
        else if (cityName) {
            const data = await this.getWeatherWithCityName(cityName);

            if (data.cod === "404") {
                return {
                    name: "weather",
                    type: "loc",
                    message: "Location not found."
                };
            }
            else if (data.cod === "500") {
                return;
            }
            return this.parseWeather(data, units);
        }
    }
}
