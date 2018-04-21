import { Component } from "@angular/core";
import { SettingService } from "../../services/settingService";
import { dispatchCustomEvent } from "../../utils/utils";

@Component({
    selector: "settings",
    templateUrl: "./settings.html"
})
export class Settings {
    logginInToDropbox: boolean = false;
    active: string = "general";
    settings: any;

    constructor(private settingService: SettingService) {
        this.settingService = settingService;
        this.settings = this.settingService.getSettings();
    }

    ngOnInit() {
        window.addEventListener("dropbox-window-closed", () => {
            this.logginInToDropbox = false;
        });
    }

    setActiveTab(tab) {
        this.active = tab;
    }

    onSetting(settingName, value, dontSave = false) {
        this.settings = this.settingService.updateSetting({
            [this.active]: {
                [settingName]: value
            }
        }, dontSave);
    }

    toggleSettingCheckbox(settingName) {
        this.onSetting(settingName, !this.settings[this.active][settingName]);
    }

    toggleTimeFormat() {
        const { format } = this.settings[this.active];

        this.onSetting("format", format === 24 ? 12 : 24);
    }

    toggleTemperatureUnits() {
        const { units } = this.settings[this.active];

        this.onSetting("units", units === "C" ? "F" : "C");
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

    loginToDropbox() {
        this.logginInToDropbox = true;
        dispatchCustomEvent("dropbox-login");
    }
}
