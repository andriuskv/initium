import { Component, Output, EventEmitter } from "@angular/core";
import { LocalStorageService } from "services/localStorageService";
import { SettingService } from "services/settingService";

@Component({
    selector: "settings",
    providers: [SettingService],
    templateUrl: "app/components/settings/settings.html"
})
export class Settings {
    @Output() setting = new EventEmitter();

    static get parameters() {
        return [[LocalStorageService], [SettingService]];
    }

    constructor(localStorageService, settingService) {
        this.storage = localStorageService;
        this.settingService = settingService;
        this.active = "general";
    }

    ngOnInit() {
        const defaultSettings = this.settingService.getDefault();
        const storedSettings = this.storage.get("settings") || {};

        this.settings = Object.assign(defaultSettings, storedSettings);

        for (const settingsFor of Object.keys(this.settings)) {
            const settings = this.settings[settingsFor];

            settings.for = settingsFor;
            this.setting.emit(settings);
        }
    }

    getWeatherWithCityName(event) {
        if (event.key === "Enter" && event.target.value !== this.settings.weather.cityName.value) {
            this.onSetting(event, "weather", "cityName", event.target.value);
        }
    }

    onSetting(event, settingFor, settingName, value) {
        const setting = {
            for: settingFor,
            name: settingName,
            value
        };

        this.setting.emit({
            for: settingFor,
            [settingName]: this.settingService.set(event.target, this.settings, setting)
        });
    }
}
