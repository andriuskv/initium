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
        const focus = !settings.general.notificationFocusDisabled;

        return new Promise(resolve => {
            if (settings.general.notificationDisabled) {
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
