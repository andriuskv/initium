import { Component, Output, EventEmitter, Input } from "@angular/core";

@Component({
    selector: "calendar-selected-day",
    templateUrl: "app/components/calendar-selected-day/calendar-selected-day.html"
})
export class CalendarSelectedDay {
    @Output() event = new EventEmitter();
    @Output() notify = new EventEmitter();
    @Output() remove = new EventEmitter();
    @Output() repeat = new EventEmitter();
    @Input() day;

    constructor() {
        this.reminderInputEnabled = false;
        this.repeatEnabled = false;
    }

    ngOnChanges(changes) {
        if (changes.day) {
            this.selectedDay = changes.day.currentValue;
        }
    }

    showCalendar() {
        this.event.emit(false);
    }

    toggleReminderInput() {
        this.reminderInputEnabled = !this.reminderInputEnabled;
    }

    toggleRepeat() {
        this.repeatEnabled = !this.repeatEnabled;
    }

    removeReminder(index) {
        const [reminder] = this.selectedDay.reminders.splice(index, 1);

        this.remove.emit(reminder);
    }

    createReminder(form) {
        const reminder = {
            text: form.reminder.value
        };

        if (!reminder.text) {
            return;
        }

        if (this.repeatEnabled) {
            const dayGap = Number.parseInt(form.repeat.value, 10);

            if (!Number.isNaN(dayGap)) {
                reminder.year = this.selectedDay.year;
                reminder.month = this.selectedDay.month;
                reminder.day = this.selectedDay.number + dayGap;
                reminder.gap = dayGap;
                reminder.repeat = true;
                this.repeat.emit(reminder);
            }
            this.repeatEnabled = false;
        }
        this.notify.emit(this.selectedDay);
        this.selectedDay.reminders.push(reminder);
        this.showReminderInput = false;
        form.reset();
    }
}
