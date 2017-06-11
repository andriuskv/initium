export class NotificationService {
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
        const settings = JSON.parse(localStorage.getItem("settings"));

        return new Promise(resolve => {
            if (settings.general.notificationDisabled) {
                resolve(true);
                return;
            }
            if ((Notification as any).permission === "granted") {
                let notification = null;

                notification = new Notification(title, {
                    body,
                    icon: "./assets/images/128.png"
                });
                this.onBeforeUnload(notification);
                this.closeNotification(notification, 6000);

                notification.onclick = () => {
                    notification.close();
                    notification.onclick = null;
                    notification = null;
                    if (!settings.general.notificationFocusDisabled) {
                        window.focus();
                    }
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
        });
    }
}
