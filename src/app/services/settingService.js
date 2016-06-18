import { LocalStorageService } from "app/services/localStorageService";

export class SettingService {
    static get parameters() {
        return [[LocalStorageService]];
    }

    constructor(localStorageService) {
        this.storage = localStorageService;
    }

    getDefault() {
        return {
            notification: {
                notificationDisabled: {
                    name: "notificationDisabled",
                    value: false
                },
                focusDisabled: {
                    name: "focusDisabled",
                    value: false
                }
            },
            time: {
                dateDisabled: {
                    name: "dateDisabled",
                    value: false
                },
                timeDisplay: {
                    name: "timeDisplay",
                    value: 1
                }
            },
            reminders: {
                notificationDisabled: {
                    name: "notificationDisabled",
                    value: false
                }
            },
            weather: {
                cityName: {
                    name: "cityName",
                    value: ""
                },
                weatherDisabled: {
                    name: "weatherDisabled",
                    value: false
                },
                units: {
                    name: "units",
                    value: "C"
                }
            }
        };
    }

    set(target, settings, setting) {
        let settingProp = null;
        let save = true;

        if (target.type === "checkbox") {
            setting.value = target.checked;
        }
        else if (target.type.includes("select")) {
            setting.value = target.value;
        }

        if (setting.for === "weather") {
            if (setting.name === "units") {
                setting.value = setting.value ? "F" : "C";
            }
        }
        else if (setting.for === "background" || setting.for === "mostVisited") {
            setting.value = true;
            save = false;
        }

        settingProp = {
            name: setting.name,
            value: setting.value
        };

        if (save) {
            settings[setting.for][setting.name] = settingProp;
        }

        this.storage.set("settings", settings);
        return settingProp;
    }
}
