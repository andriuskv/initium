import { Component } from "@angular/core";
import { SettingService } from "../../services/settingService";
import { WeatherService } from "../../services/weatherService";

@Component({
    selector: "weather",
    template: `
        <div class="weather" *ngIf="!disabled && showWeather"
            [class.is-fetching]="isFetching"
            [class.done-fetching]="doneFetcing"
            [title]="weather.description">
            <div class="weather-temp-icon-container">
                <span class="weather-temp">{{ weather.temp }}</span>
                <svg class="weather-icon" viewBox="0 0 24 24">
                    <use attr.href="#weather-{{ icon }}"></use>
                </svg>
            </div>
            <div>{{ weather.city }}</div>
        </div>
    `
})
export class Weather {
    showWeather: boolean = false;
    initialized: boolean = false;
    disabled: boolean = false;
    isFetching: boolean;
    doneFetcing: boolean;
    temperature: number = 0;
    units: string = "C";
    icon: string = "";
    cityName: string;
    timeout: any;
    weather: any = {};

    constructor(private settingService: SettingService, private weatherService: WeatherService) {
        this.settingService = settingService;
        this.weatherService = weatherService;
    }

    ngOnInit() {
        const { disabled, cityName, useFarenheit } = this.settingService.getSetting("weather");

        this.disabled = disabled;
        this.cityName = cityName;
        this.units = this.getTempUnits(useFarenheit);

        this.initWeather(cityName, disabled);
        this.settingService.subscribeToChanges(this.changeHandler.bind(this));
    }

    changeHandler({ weather }) {
        if (!weather) {
            return;
        }
        const { disabled, useFarenheit, cityName } = weather;

        if (typeof disabled === "boolean") {
            this.disabled = disabled;

            if (!disabled) {
                this.getWeather(this.cityName);
            }
        }
        else if (typeof useFarenheit === "boolean") {
            const units = this.getTempUnits(useFarenheit);

            this.units = units;
            this.weather.temp = this.getTemp(this.temperature, units);
        }
        else if (typeof cityName === "string") {
            this.cityName = cityName;

            if (!this.disabled && this.initialized) {
                this.isFetching = true;
                this.getWeather(cityName);
            }
        }
    }

    initWeather(cityName, isDisabled) {
        if (isDisabled) {
            this.initialized = true;
            return;
        }
        setTimeout(() => {
            this.initialized = true;
            this.getWeather(cityName);
        }, 10000);
    }

    getTempUnits(useFarenheit) {
        return useFarenheit ? "F" : "C";
    }

    getWeather(cityName) {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
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
        this.icon = this.getIcon(data.icon.id, data.icon.code);
        this.showWeather = true;

        if (this.isFetching) {
            this.doneFetcing = true;

            setTimeout(() => {
                this.isFetching = false;
                this.doneFetcing = false;
            }, 1200);
        }
    }

    getIcon(id, code) {
        switch (id) {
            // Thunderstorm
            case 201:
            case 211:
                return "lightning";
            // Rain
            case 300:
            case 301:
            case 500:
                return "rainy";
            // Shower rain
            case 501:
            case 502:
            case 520:
            case 521:
                return "pouring";
            // Light snow, light shower sleet, snow, heavy snow
            case 600:
            case 601:
            case 602:
            case 612:
            case 615:
            case 620:
            case 621:
                return "snowy";
            // Mist, Fog
            case 701:
            case 741:
                return "fog";
            // Clear sky, broken clouds, overcast clouds, scattered clouds
            case 800:
            case 801:
            case 802:
            case 803:
            case 804:
                if (code === "01d") {
                    return "sunny";
                }
                else if (code === "01n") {
                    return "night";
                }
                return "cloudy";
            // Hail
            case 906:
                return "hail";
        }
        return "";
    }
}
