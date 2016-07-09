import { Component, Output, EventEmitter } from "@angular/core";
import { Settings } from "components/settings/settings";
import { DropboxComp } from "components/dropbox/dropbox";
import { Calendar } from "components/calendar/calendar";

@Component({
    selector: "widget-menu",
    directives: [Settings, DropboxComp, Calendar],
    templateUrl: "app/components/widget-menu/widget-menu.html"
})
export class WidgetMenu {
    @Output() toggle = new EventEmitter();
    @Output() setting = new EventEmitter();
    @Output() background = new EventEmitter();
    @Output() reminders = new EventEmitter();

    constructor() {
        this.visible = false;
        this.title = "Widgets";
    }

    toggleMenu() {
        this.visible = !this.visible;
        if (!this.visible) {
            this.title = "Widgets";
            this.selectedItem = "";
        }
    }

    toggleTimer() {
        this.toggle.emit("timer");
    }

    toggleWidget(widget) {
        this.selectedItem = widget || "";
        this.title = widget || "Widgets";
    }

    onSetting(setting) {
        this.setting.emit(setting);

        const notificationDisabled = setting.notificationDisabled;

        if (notificationDisabled) {
            this.notificationDisabled = notificationDisabled.value;
        }
    }

    onBackground(background) {
        this.background.emit(background);
    }

    onReminders(reminders) {
        this.reminders.emit(reminders);
    }
}
