import { Subject } from "rxjs/Subject";

export class SettingService {
    settings: any = this.initSettings();
    data: Subject<object> = new Subject();

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
                notificationsDisabled: true,
                notificationFocusDisabled: true
            },
            mainBlock: {
                isNavHidden: false
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

    getSetting(setting) {
        return this.settings[setting];
    }

    subscribeToChanges(nextHandler) {
        this.data.subscribe(nextHandler);
    }

    updateSetting(setting) {
        const settings = this.settings;
        const [settingFor] = Object.keys(setting);

        this.data.next(setting);

        if (settingFor === "mainBlock" && settings[settingFor].resetMostVisited) {
            return settings;
        }
        settings[settingFor] = Object.assign(settings[settingFor], setting[settingFor]);
        localStorage.setItem("settings", JSON.stringify(settings));
        return settings;
    }
}
