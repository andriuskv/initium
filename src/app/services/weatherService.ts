import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class WeatherService {
    fetchWeather(params) {
        return fetch(`${process.env.SERVER_URL}/owm?${params}`).then(res => res.json());
    }

    getWeatherWithCityName(name) {
        return this.fetchWeather(`q=${name}`);
    }

    getCoords() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                ({ coords }) => resolve({ lat: coords.latitude, lon: coords.longitude }),
                error => {
                    console.log(error);

                    if (error.code === 1) {
                        reject(new Error("Access to geolocation is not permited"));
                    }
                },
                { enableHighAccuracy: true });
        });
    }

    getWeatherWithCoords({ lat, lon }: any) {
        return this.fetchWeather(`lat=${lat}&lon=${lon}`);
    }

    parseWeather(data) {
        return {
            city: data.name,
            temp: data.main.temp,
            description: data.weather[0].description,
            icon: {
                id: data.weather[0].id,
                code: data.weather[0].icon
            }
        };
    }

    async getWeather(cityName) {
        let data = null;

        if (cityName) {
            data = await this.getWeatherWithCityName(cityName);

            if (data.cod === "404") {
                throw new Error("Location not found");
            }
            else if (data.cod === "500") {
                return;
            }
        }
        else {
            data = await this.getCoords().then(coords => this.getWeatherWithCoords(coords));
        }
        return this.parseWeather(data);
    }
}
