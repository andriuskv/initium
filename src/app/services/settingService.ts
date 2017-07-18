export class SettingService {
    settings: any;

    constructor() {
        this.settings = this.initSettings();
    }

    initSettings() {
        const defaultSettings = this.getDefault();
        const storedSettings = JSON.parse(localStorage.getItem("settings")) || {};

        return Object.assign(defaultSettings, storedSettings);
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
            mainBlock: {
                hideItemBar: false
            },
            time: {
                dateDisabled: false,
                timeDisplay: "1"
            },
            weather: {
                disabled: false,
                cityName: "",
                useFarenheit: false
            }
        };
    }

    getSettings() {
        return this.settings;
    }

    updateSetting(setting) {
        const settings = this.settings;
        const [settingFor] = Object.keys(setting);

        settings[settingFor] = Object.assign(settings[settingFor], setting[settingFor]);
        localStorage.setItem("settings", JSON.stringify(settings));
        return settings;
    }
}
