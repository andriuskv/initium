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
                <i class="wi wi-owm-{{ icon }} weather-icon"></i>
            </div>
            <div class="weather-city">{{ city }}</div>
        </div>
    `,
    styleUrls: ["./weather-icons.min.css", "./weather.scss"]
})
export class Weather {
    disabled: boolean = false;
    temperature: number = 0;
    timeout: number = 0;
    city: string = "";
    description: string = "";
    units: string = "C";
    icon: number | string;
    cityName: string = "";

    constructor(private settingService: SettingService, private weatherService: WeatherService) {}

    ngOnInit() {
        const { disabled, cityName, units } = this.settingService.getSetting("weather");

        this.disabled = disabled;
        this.cityName = cityName;
        this.units = units;

        if (!disabled) {
            this.scheduleWeatherUpdate();
        }
        this.settingService.subscribeToSettingChanges(this.changeHandler.bind(this));
    }

    changeHandler({ weather }) {
        if (!weather) {
            return;
        }
        const { disabled, cityName, units } = weather;

        if (units !== this.units) {
            this.units = units;
            this.temperature = this.convertTemperature(this.temperature, units);
        }
        else if (cityName !== this.cityName) {
            this.cityName = cityName;

            if (!disabled) {
                this.getWeather();
            }
        }
        else if (disabled !== this.disabled) {
            this.disabled = disabled;

            if (disabled) {
                clearTimeout(this.timeout);
            }
            else {
                this.getWeather();
            }
        }
    }

    scheduleWeatherUpdate(delay = 10000) {
        this.timeout = window.setTimeout(() => {
            this.getWeather();
        }, delay);
    }

    async getWeather() {
        clearTimeout(this.timeout);

        try {
            const data = await this.weatherService.getWeather(this.cityName);

            if (data) {
                this.displayWeather(data);
                this.settingService.updateMessage({ weather: "" });
            }
        }
        catch (e) {
            console.log(e);
            this.settingService.updateMessage({ weather: e.message });
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
        if (id === 800) {
            const partOfDay = code.slice(-1) === "n" ? "night" : "day";

            return `${partOfDay}-${id}`;
        }
        return id;
    }
}
