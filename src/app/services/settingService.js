export class SettingService {
    getDefault() {
        return {
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
}
