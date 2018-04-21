import { Subject } from "rxjs";

export class SettingService {
    settings: any = this.initSettings();
    data: Subject<object> = new Subject();

    initSettings() {
        const settings = JSON.parse(localStorage.getItem("settings")) || {};

        return this.copyObject(settings, this.getDefault());
    }

    copyObject(obj, mainObj) {
        for (const key of Object.keys(mainObj)) {
            if (typeof obj[key] === "undefined") {
                obj[key] = mainObj[key];
            }
            else if (typeof obj[key] === "object") {
                obj[key] = this.copyObject(obj[key], mainObj[key]);
            }
        }
        return obj;
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
                isNavHidden: false,
                showingOneRow: true
            },
            time: {
                dateHidden: false,
                format: 24
            },
            weather: {
                disabled: false,
                cityName: "",
                units: "C"
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

    updateSetting(setting, dontSave = false) {
        const settings = this.settings;
        const [settingFor] = Object.keys(setting);

        this.data.next(setting);

        if (dontSave) {
            return settings;
        }
        settings[settingFor] = Object.assign(settings[settingFor], setting[settingFor]);
        localStorage.setItem("settings", JSON.stringify(settings));
        return settings;
    }
}
