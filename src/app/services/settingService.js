import { LocalStorageService } from "services/localStorageService";

export class SettingService {
    static get parameters() {
        return [[LocalStorageService]];
    }

    constructor(localStorageService) {
        this.storage = localStorageService;
        this.storage.set("settings", this.getSettings());
    }

    getDefault() {
        return {
            background: {
                url: ""
            },
            general: {
                notificationDisabled: false,
                notificationFocusDisabled: false
            },
            time: {
                dateDisabled: false,
                timeDisplay: "1",
                calendarRemindersDisabled: false
            },
            weather: {
                disabled: false,
                cityName: "",
                useFarenheit: false
            }
        };
    }

    getSettings() {
        const defaultSettings = this.getDefault();
        const storedSettings = this.storage.get("settings") || {};

        return Object.assign(defaultSettings, storedSettings);
    }

    updateSetting(setting) {
        const settings = this.getSettings();
        const [settingFor] = Object.keys(setting);

        settings[settingFor] = Object.assign(settings[settingFor], setting[settingFor]);
        this.storage.set("settings", settings);
        return settings;
    }
}
