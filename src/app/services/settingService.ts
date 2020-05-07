import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({
    providedIn: "root"
})
export class SettingService {
    settings: any = this.initSettings();
    messages: any = {};
    settingSubject: Subject<object> = new Subject();
    messageSubject: Subject<object> = new Subject();

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
                disabled: false,
                dateHidden: false,
                format: 24
            },
            weather: {
                disabled: false,
                useGeo: false,
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

    announceSettingChange(setting) {
        this.settingSubject.next(setting);
    }

    subscribeToSettingChanges(handler) {
        return this.settingSubject.subscribe(handler);
    }

    subscribeToMessageChanges(handler) {
        this.messageSubject.subscribe(handler);
    }

    updateSetting(setting) {
        const settings = this.settings;
        const [settingFor] = Object.keys(setting);

        settings[settingFor] = { ...settings[settingFor], ...setting[settingFor] };
        this.settingSubject.next(setting);
        localStorage.setItem("settings", JSON.stringify(settings));
        return settings;
    }

    setSetting(setting) {
        const settings = this.settings;
        const [settingFor] = Object.keys(setting);

        settings[settingFor] = setting[settingFor];
        this.settingSubject.next(setting);
        localStorage.setItem("settings", JSON.stringify(settings));
        return settings;
    }

    updateMessage(message) {
        this.messages = { ...this.messages, ...message };
        this.messageSubject.next(message);
    }
}
