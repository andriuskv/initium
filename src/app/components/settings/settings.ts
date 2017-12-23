import { Component } from "@angular/core";
import { SettingService } from "../../services/settingService";

@Component({
    selector: "settings",
    templateUrl: "./settings.html"
})
export class Settings {
    active: string = "general";
    settings: any;

    constructor(private settingService: SettingService) {
        this.settingService = settingService;
        this.settings = this.settingService.getSettings();
    }

    setActiveTab(tab) {
        this.active = tab;
    }

    onSetting(settingName, value) {
        this.settings = this.settingService.updateSetting({
            [this.active]: {
                [settingName]: value
            }
        });
    }

    getWeatherWithCityName(value) {
        if (value !== this.settings.weather.cityName) {
            this.onSetting("cityName", value);
        }
    }

    setPomodoroDuration({ target }, setting) {
        let value = parseInt(target.value, 10);

        if (!value || value <= 0) {
            value = 1;
            target.value = value;
        }
        this.onSetting(setting, value);
    }
}
