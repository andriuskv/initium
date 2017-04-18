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

    showMenu() {
        this.visible = true;
    }

    toggleUpperBlockComp() {
        this.toggle.emit("upper");
    }

    toggleWidget(widget) {
        if (!widget && !this.selectedItem) {
            this.visible = false;
        }
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
