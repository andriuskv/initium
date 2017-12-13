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
                notificationDisabled: true,
                notificationFocusDisabled: true
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
            },
            pomodoro: {
                duration: 25,
                short: 5,
                long: 15
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
