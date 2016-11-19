export class SettingService {
    constructor() {
        localStorage.setItem("settings", JSON.stringify(this.getSettings()));
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
        const storedSettings = JSON.parse(localStorage.getItem("settings")) || {};

        return Object.assign(defaultSettings, storedSettings);
    }

    updateSetting(setting) {
        const settings = this.getSettings();
        const [settingFor] = Object.keys(setting);

        settings[settingFor] = Object.assign(settings[settingFor], setting[settingFor]);
        localStorage.setItem("settings", JSON.stringify(settings));
        return settings;
    }
}
