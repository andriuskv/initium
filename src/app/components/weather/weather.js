import { Component, Input } from "@angular/core";
import { WeatherService } from "Services/weatherService";

@Component({
    selector: "weather",
    template: `
        <div class="weather" *ngIf="!disabled && showWeather"
            [class.is-fetching]="isFetching"
            [class.done-fetching]="doneFetcing"
            [title]="weather.description">
            <div class="weather-temp">{{ weather.temp }}</div>
            <div [class]="iconClassName"></div>
            <div class="weather-city-name">{{ weather.city }}</div>
        </div>
    `
})
export class Weather {
    @Input() setting;

    static get parameters() {
        return [[WeatherService]];
    }

    constructor(weatherService) {
        this.weatherService = weatherService;
        this.weather = {};
        this.temperature = 0;
        this.units = "C";
        this.timeout = 0;
        this.iconClassName = "weather-icon";
        this.showWeather = false;
        this.initialized = false;
        this.disabled = false;
    }

    ngOnChanges(changes) {
        const setting = changes.setting;

        if (setting.firstChange) {
            return;
        }
        const { disabled, useFarenheit, cityName } = setting.currentValue;

        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }

        if (typeof disabled === "boolean") {
            this.disabled = disabled;

            if (!this.disabled) {
                if (this.initialized) {
                    this.getWeather(this.cityName);
                }
                else {
                    setTimeout(() => {
                        this.initialized = true;
                        this.getWeather(this.cityName);
                    }, 10000);
                }
            }
            else {
                this.initialized = true;
            }
        }
        if (typeof useFarenheit === "boolean") {
            const units = useFarenheit ? "F" : "C";

            this.units = units;
            this.weather.temp = this.getTemp(this.temperature, units);
        }
        if (typeof cityName === "string") {
            this.cityName = cityName;

            if (!this.disabled && this.initialized) {
                this.isFetching = true;
                this.getWeather(this.cityName);
            }
        }
    }

    getWeather(cityName) {
        this.weatherService.getWeather(cityName)
        .then(data => {
            this.displayWeather(data);
        })
        .catch(error => {
            console.log(error);
        });

        this.timeout = setTimeout(() => {
            this.getWeather(this.cityName);
        }, 960000);
    }

    getTemp(temp, units = "C") {
        if (units === "F") {
            temp = temp * 9 / 5 + 32;
        }
        return `${Math.round(temp)}°${units}`;
    }

    displayWeather(data) {
        this.temperature = data.temp;
        this.weather.temp = this.getTemp(data.temp, this.units);
        this.weather.city = data.city;
        this.weather.description = data.description;
        this.displayIcon(data.icon.id, data.icon.code);
        this.showWeather = true;

        if (this.isFetching) {
            this.doneFetcing = true;

            setTimeout(() => {
                this.isFetching = false;
                this.doneFetcing = false;
            }, 1200);
        }
    }

    displayIcon(id, code) {
        let iconClassName = "";

        switch (id) {
            // Thunderstorm
            case 211:
                iconClassName = "icon-cloud-flash-inv";
                break;
            // Rain
            case 300:
            case 500:
                iconClassName = "icon-drizzle-inv";
                break;
            // Shower rain
            case 501:
            case 502:
            case 520:
            case 521:
                iconClassName = "icon-rain-inv";
                break;
            // Light snow, light shower sleet
            case 600:
            case 612:
            case 615:
            case 620:
                iconClassName = "icon-snow-inv";
                break;
            // Snow, heavy snow
            case 601:
            case 602:
            case 621:
                iconClassName = "icon-snow-heavy-inv";
                break;
            case 701:
                iconClassName = "icon-mist";
                break;
            // Fog
            case 741:
                iconClassName = "icon-fog-cloud";
                break;
            // Clear sky, Broken clouds, overcast clouds, scattered clouds
            case 800:
            case 801:
            case 802:
            case 803:
            case 804:
                if (code === "01d") {
                    iconClassName = "icon-sun-inv";
                }
                else if (code === "01n") {
                    iconClassName = "icon-moon-inv";
                }
                else if (code === "02d") {
                    iconClassName = "icon-cloud-sun-inv";
                }
                else if (code === "02n") {
                    iconClassName = "icon-cloud-moon-inv";
                }
                else {
                    iconClassName = "icon-clouds-inv";
                }
                break;
            // Hail
            case 906:
                iconClassName = "icon-hail-inv";
                break;
            default:
                iconClassName = "icon-na";
                break;
        }
        this.iconClassName = `weather-icon ${iconClassName}`;
    }
}
