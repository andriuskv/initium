import { Component, Input } from "@angular/core";

@Component({
    selector: "calendar-reminders",
    template: `
        <ul class="panel reminders" *ngIf="!disabled && reminders.length">
            <li class="panel-item" *ngFor="let reminder of reminders">{{ reminder.text }}</li>
        </ul>`
})
export class CalendarReminders {
    @Input() setting;
    @Input() newReminders;

    disabled: boolean = false;
    reminders: Array<any> = [];

    ngOnChanges(changes) {
        if (changes.newReminders && !changes.newReminders.isFirstChange()) {
            this.reminders = changes.newReminders.currentValue;
        }
        if (changes.setting && changes.setting.currentValue) {
            const setting = changes.setting.currentValue;

            if (typeof setting.calendarRemindersDisabled === "boolean") {
                this.disabled = setting.calendarRemindersDisabled;
            }
        }
    }
}
