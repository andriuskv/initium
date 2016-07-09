import { LocalStorageService } from "services/localStorageService";

export class NotificationService {
    static get parameters() {
        return [[LocalStorageService]];
    }

    constructor(localStorageService) {
        this.storage = localStorageService;
    }

    closeNotification(notification, delay) {
        setTimeout(() => {
            if (notification) {
                notification.close();
            }
        }, delay);
    }

    onBeforeUnload(notification) {
        window.onbeforeunload = () => {
            if (notification) {
                notification.close();
            }
        };
    }

    send(title, body) {
        const settings = this.storage.get("settings");
        let focus = true;

        if (settings) {
            focus = !settings.notification.focusDisabled.value;
        }

        return new Promise(resolve => {
            if (settings.notification.notificationDisabled.value) {
                resolve(true);
                return;
            }
            if (Notification.permission === "granted") {
                let notification = null;

                notification = new Notification(title, {
                    body,
                    icon: "./resources/images/128.png"
                });
                this.onBeforeUnload(notification);
                this.closeNotification(notification, 6000);

                notification.onclick = () => {
                    notification.close();
                    notification.onclick = null;
                    notification = null;
                    resolve();
                };
            }
            else {
                Notification.requestPermission()
                .then(response => {
                    if (response === "granted") {
                        this.send(title, body);
                    }
                });
            }
        })
        .then(() => {
            if (focus) {
                window.focus();
            }
        });
    }
}
