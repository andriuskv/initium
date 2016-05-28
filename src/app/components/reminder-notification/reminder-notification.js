import { Component, Input } from "@angular/core";

@Component({
    selector: "reminders",
    template: `
        <ul class="list reminders" *ngIf="!disabled && reminders && reminders.length">
            <li *ngFor="let reminder of reminders">{{ reminder.text }}</li>
        </ul>`
})
export class ReminderNotification {
    @Input() setting;
    @Input() newReminders;

    constructor() {
        this.disabled = true;
    }

    ngOnChanges(changes) {
        if (changes.newReminders && changes.newReminders.currentValue) {
            this.reminders = changes.newReminders.currentValue;
        }
        if (changes.setting && changes.setting.currentValue) {
            const setting = changes.setting.currentValue;

            this.disabled = setting.notificationDisabled.value;
        }
    }
}
