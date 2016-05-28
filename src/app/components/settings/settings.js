import { Component, Output, EventEmitter } from "@angular/core";
import { LocalStorageService } from "app/services/localStorageService";
import { SettingService } from "app/services/settingService";

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
        this.active = "time";
    }

    ngOnInit() {
        this.settings = this.storage.get("settings") || this.settingService.getDefault();

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

    onSetting(event, settingFor, setting, value) {
        const target = event.target;
        let settingProp = null;
        let save = true;

        if (target.type === "checkbox") {
            value = event.target.checked;
        }
        else if (target.type.includes("select")) {
            value = event.target.value;
        }

        if (settingFor === "weather") {
            if (setting === "units") {
                value = value ? "F" : "C";
            }
        }
        else if (settingFor === "background" || settingFor === "mostVisited") {
            value = true;
            save = false;
        }

        settingProp = {
            name: setting,
            value
        };
        this.setting.emit({
            for: settingFor,
            [setting]: settingProp
        });

        if (save) {
            this.settings[settingFor][setting] = settingProp;
        }
        this.storage.set("settings", this.settings);
    }
}
