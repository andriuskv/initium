export class WeatherService {
    fetchWeather(params) {
        const url = "http://api.openweathermap.org/data/2.5/weather";
        const units = "metric";
        const id = "";

        return fetch(`${url}?${params}&units=${units}&appid=${id}`)
        .then(response => response.json());
    }

    getWeatherWithCityName(name) {
        return this.fetchWeather(`q=${name}`);
    }

    getCoords() {
        function geoError(error) {
            console.log(error);
        }
        return new Promise(resolve => {
            navigator.geolocation.getCurrentPosition(position => {
                const coords = position.coords;

                resolve({ lat: coords.latitude, lon: coords.longitude });
            }, geoError, { enableHighAccuracy: true });
        });
    }

    getWeatherWithCoords({ lat, lon }) {
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

    getWeather(cityName) {
        const weather = cityName ?
            this.getWeatherWithCityName(cityName) :
            this.getCoords().then(coords => this.getWeatherWithCoords(coords));

        return weather.then(this.parseWeather);
    }
}
