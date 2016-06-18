import { LocalStorageService } from "app/services/localStorageService";

export class NotificationService {
    static get parameters() {
        return [[LocalStorageService]];
    }

    constructor(localStorageService) {
        this.storage = localStorageService;
    }

    send(title, body) {
        const settings = this.storage.get("settings");
        let focus = true;

        if (settings) {
            focus = !settings.notification.focusDisabled.value;
        }

        return new Promise(resolve => {
            let notification = null;

            if (settings.notification.notificationDisabled.value) {
                resolve(true);
                return;
            }
            if (Notification.permission === "granted") {
                notification = new Notification(title, {
                    icon: "./resources/images/128.png",
                    body: body
                });

                setTimeout(() => {
                    if (notification) {
                        notification.close();
                    }
                }, 6000);

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
