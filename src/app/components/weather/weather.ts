import { Component } from "@angular/core";
import { convertTemperature } from "../../utils/utils";
import { SettingService } from "../../services/settingService";
import { WeatherService } from "../../services/weatherService";
import { TimeDateService } from "../../services/timeDateService";
import { ZIndexService } from "../../services/zIndexService";

@Component({
    selector: "weather",
    templateUrl: "./weather.html",
    styleUrls: ["./weather.scss"]
})
export class Weather {
    disabled = false;
    useGeo = false;
    moreWeatherVisible = false;
    zIndex = 0;
    timeout = 0;
    hourlyTimeout = 0;
    lastHourlyWeatherUpdate = 0;
    timeFormat = 24;
    units = "C";
    cityName = "";
    current = null;
    hourly = [];

    constructor(
        private settingService: SettingService,
        private weatherService: WeatherService,
        private timeDateService: TimeDateService,
        private zIndexService: ZIndexService
    ) {}

    ngOnInit() {
        const { disabled, cityName, units, useGeo } = this.settingService.getSetting("weather");
        const { format } = this.settingService.getSetting("time");

        this.disabled = disabled;
        this.cityName = cityName;
        this.units = units;
        this.useGeo = useGeo;
        this.timeFormat = format;

        if (!disabled && (cityName || useGeo)) {
            this.scheduleWeatherUpdate();
        }
        this.settingService.subscribeToSettingChanges(this.changeHandler.bind(this));
    }

    changeHandler({ weather, time }) {
        if (time) {
            if (typeof time.format === "number") {
                this.timeFormat = time.format;
                this.hourly = this.hourly.map(item => {
                    const { hours, period } = this.timeDateService.getTime({ hours: item.forecastHours }, time.format);
                    item.time = `${hours}:00${period ? ` ${period}` : ""}`;
                    return item;
                });
            }
            return;
        }
        else if (!weather) {
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

            if (useGeo || this.cityName) {
                this.disabled = false;
                this.getWeather();
            }
            else {
                this.disabled = true;
                clearTimeout(this.timeout);
            }
        }
        else if (typeof units === "string") {
            this.units = units;

            if (this.current) {
                this.current.temperature = convertTemperature(this.current.temperature, units);
                this.hourly = this.hourly.map(item => {
                    item.temperature = convertTemperature(item.temperature, units);
                    return item;
                });
            }
        }
    }

    showMoreWeather() {
        this.moreWeatherVisible = true;
        this.zIndex = this.zIndexService.inc();

        if (Date.now() - this.lastHourlyWeatherUpdate > 1200000) {
            this.getHourlyWeather();
        }
        this.scheduleHourlyWeatherUpdate();
    }

    hideMoreWeather() {
        this.moreWeatherVisible = false;
        clearTimeout(this.hourlyTimeout);
    }

    async getHourlyWeather() {
        const data = await this.weatherService.getHourlyWeather({
            coords: this.current.coords,
            units: this.units,
            timeFormat: this.timeFormat
        });
        this.hourly = data || this.hourly;
        this.lastHourlyWeatherUpdate = Date.now();
    }

    scheduleHourlyWeatherUpdate() {
        this.hourlyTimeout = window.setTimeout(() => {
            this.getHourlyWeather();
            this.scheduleHourlyWeatherUpdate();
        }, 1200000);
    }

    scheduleWeatherUpdate(delay = 10000) {
        this.timeout = window.setTimeout(() => {
            this.getWeather();
        }, delay);
    }

    async getWeather() {
        clearTimeout(this.timeout);

        try {
            const data = await this.weatherService.getWeather({
                cityName: this.cityName,
                useGeo: this.useGeo,
                units: this.units
            });

            if (!data) {
                return;
            }

            if (data.message) {
                this.settingService.updateMessage({ weather: data });
            }
            else {
                this.current = data;
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

    handleClickOnContainer() {
        this.zIndex = this.zIndexService.incIfLess(this.zIndex);
    }
}
