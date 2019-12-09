import { Injectable } from "@angular/core";
import { SettingService } from "../services/settingService";

@Injectable({
    providedIn: "root"
})
export class NotificationService {
    timeout: any;

    constructor(private settingService: SettingService) {
        this.settingService.subscribeToSettingChanges(({ general }) => {
            if (!general) {
                return;
            }
            const disabled = general.notificationsDisabled;

            if (typeof disabled === "boolean" && !disabled) {
                Notification.requestPermission().then(permission => {
                    if (permission !== "granted") {
                        this.settingService.updateSetting({
                            general: { notificationsDisabled: true }
                        });
                    }
                });
            }
        });
    }

    send(title, body, cb) {
        const settings = this.settingService.getSetting("general");

        if (settings.notificationsDisabled || Notification.permission !== "granted") {
            return;
        }
        let notification = new Notification(title, {
            body,
            icon: "./assets/images/128.png"
        });

        this.timeout = setTimeout(() => {
            if (notification) {
                notification.close();
            }
        }, 8000);

        window.onbeforeunload = () => {
            if (notification) {
                notification.close();
            }
        };

        notification.onclick = () => {
            cb();
            notification.close();

            if (!settings.notificationFocusDisabled) {
                window.focus();
            }
        };

        notification.onclose = () => {
            clearTimeout(this.timeout);
            this.timeout = null;
            notification = null;
        };
    }
}
