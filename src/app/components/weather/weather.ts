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
    disabled = false;
    useGeo = false;
    temperature = 0;
    timeout = 0;
    city = "";
    description = "";
    units = "C";
    cityName = "";
    icon: number | string;

    constructor(private settingService: SettingService, private weatherService: WeatherService) {}

    ngOnInit() {
        const { disabled, cityName, units, useGeo } = this.settingService.getSetting("weather");

        this.disabled = disabled;
        this.cityName = cityName;
        this.units = units;
        this.useGeo = useGeo;

        if (!disabled && (cityName || useGeo)) {
            this.scheduleWeatherUpdate();
        }
        this.settingService.subscribeToSettingChanges(this.changeHandler.bind(this));
    }

    changeHandler({ weather }) {
        if (!weather) {
            return;
        }
        const { disabled, cityName, units, useGeo } = weather;

        if (typeof disabled === "boolean") {
            this.disabled = disabled;

            if (disabled) {
                clearTimeout(this.timeout);
            }
            else if (this.cityName || this.useGeo) {
                this.getWeather();
            }
            else {
                this.disabled = true;
            }
        }
        else if (typeof cityName === "string") {
            this.cityName = cityName;

            if (cityName) {
                this.disabled = false;
                this.getWeather();
            }
            else if (!this.useGeo) {
                this.disabled = true;
                clearTimeout(this.timeout);
            }
        }
        else if (typeof useGeo === "boolean") {
            this.useGeo = useGeo;

            if (useGeo) {
                this.disabled = false;
                this.getWeather();
            }
            else if (!this.cityName) {
                this.disabled = true;
                clearTimeout(this.timeout);
            }
        }
        else if (typeof units === "string") {
            this.units = units;
            this.temperature = this.convertTemperature(this.temperature, units);
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
            const data = await this.weatherService.getWeather(this.cityName, this.useGeo);

            if (!data) {
                return;
            }

            if (data.message) {
                this.settingService.updateMessage({ weather: data });
            }
            else {
                this.displayWeather(data);
                this.settingService.updateMessage({ weather: {} });
            }
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
        if (id === 800) {
            const partOfDay = code.slice(-1) === "n" ? "night" : "day";

            return `${partOfDay}-${id}`;
        }
        return id;
    }
}
