import { Injectable } from "@angular/core";
import { SettingService } from "../services/settingService";

@Injectable({
  providedIn: "root"
})
export class NotificationService {
    timeout: any;

    constructor(private settingService: SettingService) {
        this.settingService = settingService;
    }

    send(title, body, cb) {
        const settings = this.settingService.getSetting("general");

        if (settings.notificationsDisabled) {
            return;
        }

        if ((Notification as any).permission === "granted") {
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
        else {
            Notification.requestPermission().then(response => {
                if (response === "granted") {
                    this.send(title, body, cb);
                }
            });
        }
    }
}
