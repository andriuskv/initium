import { Injectable } from "@angular/core";
import { SettingService } from "../services/settingService";

@Injectable({
    providedIn: "root"
})
export class NotificationService {
    timeout = 0;
    notificationCallback = null;
    boundClickHandler = null;
    boundCloseHandler = null;

    constructor(private settingService: SettingService) {
        this.settingService.subscribeToSettingChanges(({ general }) => {
            if (!general) {
                return;
            }
            const enabled = general.notificationsEnabled;

            if (typeof enabled === "boolean" && enabled) {
                chrome.permissions.request({ permissions: ["notifications"] }, granted => {
                    if (!granted) {
                        this.settingService.updateSetting({
                            general: { notificationsEnabled: false }
                        });
                    }
                });
            }
        });
    }

    async send(title, message, cb) {
        const settings = this.settingService.getSetting("general");
        const permission = await this.getPermission();

        if (!settings.notificationsEnabled || permission !== "granted") {
            return;
        }
        chrome.notifications.create({
            type: "basic",
            iconUrl: "./assets/images/128.png",
            title: `Initium New Tab - ${title}`,
            message
        }, id => {
            this.notificationCallback = cb;
            this.boundClickHandler = this.handleClick.bind(this);
            this.boundCloseHandler = this.handleClose.bind(this);

            this.timeout = window.setTimeout(() => {
                this.clearNotification(id);
            }, 8000);

            window.onbeforeunload = () => {
                this.clearNotification(id);
            };

            chrome.notifications.onClicked.addListener(this.boundClickHandler);
            chrome.notifications.onClosed.addListener(this.boundCloseHandler);
        });
    }

    handleClick(id) {
        const settings = this.settingService.getSetting("general");

        this.notificationCallback?.();
        this.clearNotification(id);

        if (settings.pageFocusEnabled) {
            window.focus();
        }
        chrome.notifications.onClicked.removeListener(this.boundClickHandler);
    }

    handleClose() {
        clearTimeout(this.timeout);
        this.timeout = 0;
        chrome.notifications.onClosed.removeListener(this.boundCloseHandler);
    }

    clearNotification(id) {
        return new Promise(resolve => {
            chrome.notifications.clear(id, resolve);
            chrome.notifications.onClicked.removeListener(this.boundClickHandler);
            chrome.notifications.onClosed.removeListener(this.boundCloseHandler);
        });
    }

    getPermission() {
        return new Promise(resolve => {
            if (chrome.notifications) {
                chrome.notifications.getPermissionLevel(resolve);
            }
            else {
                resolve("denied");
            }
        });
    }
}
