import { Injectable } from "@angular/core";
import { SettingService } from "../services/settingService";

@Injectable()
export class NotificationService {
    settings: any;
    timeout: any;

    constructor(private settingService: SettingService) {
        this.settingService = settingService;
        this.settings = this.settingService.getSettings().general;
    }

    send(title, body, cb) {
        if (this.settings.notificationDisabled) {
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
            }, 5000);

            window.onbeforeunload = () => {
                if (notification) {
                    notification.close();
                }
            };

            notification.onclick = () => {
                cb();
                notification.close();

                if (!this.settings.notificationFocusDisabled) {
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
