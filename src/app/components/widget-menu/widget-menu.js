import { Component, Output, EventEmitter } from "@angular/core";

@Component({
    selector: "widget-menu",
    templateUrl: "app/components/widget-menu/widget-menu.html"
})
export class WidgetMenu {
    @Output() toggle = new EventEmitter();
    @Output() setting = new EventEmitter();
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

        if (setting.time && typeof setting.time.calendarRemindersDisabled === "boolean") {
            this.remidersDisabled = setting.time.calendarRemindersDisabled;
        }
    }

    onReminders(reminders) {
        this.reminders.emit(reminders);
    }
}
