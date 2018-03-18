import { Component } from "@angular/core";
import { SettingService } from "../../services/settingService";
import { WeatherService } from "../../services/weatherService";

@Component({
    selector: "weather",
    template: `
        <div class="weather" *ngIf="!disabled && city" [title]="description">
            <div class="weather-temp-icon-container">
                <div>
                    <span class="weather-temp">{{ temperature }}</span>
                    <span class="weather-units">°{{ units }}</span>
                </div>
                <svg class="weather-icon" viewBox="0 0 24 24">
                    <use attr.href="#weather-{{ icon }}"></use>
                </svg>
            </div>
            <div>{{ city }}</div>
        </div>
    `
})
export class Weather {
    disabled: boolean = false;
    temperature: number = 0;
    timeout: number = 0;
    city: string = "";
    description: string = "";
    units: string = "C";
    icon: string = "";
    cityName: string = "";

    constructor(private settingService: SettingService, private weatherService: WeatherService) {
        this.settingService = settingService;
        this.weatherService = weatherService;
    }

    ngOnInit() {
        const { disabled, cityName, useFarenheit } = this.settingService.getSetting("weather");

        this.disabled = disabled;
        this.cityName = cityName;
        this.units = this.getTemperatureUnits(useFarenheit);

        if (!disabled) {
            this.scheduleWeatherUpdate();
        }
        this.settingService.subscribeToChanges(this.changeHandler.bind(this));
    }

    changeHandler({ weather }) {
        if (!weather) {
            return;
        }
        const { disabled, useFarenheit, cityName } = weather;

        if (typeof disabled === "boolean") {
            this.disabled = disabled;

            if (disabled) {
                clearTimeout(this.timeout);
            }
            else {
                this.getWeather();
            }
        }
        else if (typeof useFarenheit === "boolean") {
            this.units = this.getTemperatureUnits(useFarenheit);
            this.temperature = this.convertTemperature(this.temperature, this.units);
        }
        else if (typeof cityName === "string") {
            this.cityName = cityName;

            if (!this.disabled) {
                this.getWeather();
            }
        }
    }

    scheduleWeatherUpdate(delay = 10000) {
        this.timeout = window.setTimeout(() => {
            this.getWeather();
        }, delay);
    }

    getTemperatureUnits(useFarenheit) {
        return useFarenheit ? "F" : "C";
    }

    async getWeather() {
        clearTimeout(this.timeout);

        try {
            const data = await this.weatherService.getWeather(this.cityName);

            this.displayWeather(data);
        }
        catch (e) {
            console.log(e);
        }
        finally {
            this.scheduleWeatherUpdate(960000);
        }
    }

    convertTemperature(temp, units) {
        if (units === "F") {
            temp = temp * 1.8 + 32;
        }
        else {
            temp = (temp - 32) / 1.8;
        }
        return Math.round(temp);
    }

    displayWeather(data) {
        this.temperature = this.units === "C" ?
            Math.round(data.temp) :
            this.convertTemperature(data.temp, this.units);
        this.city = data.city;
        this.description = data.description;
        this.icon = this.getIcon(data.icon.id, data.icon.code);
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
