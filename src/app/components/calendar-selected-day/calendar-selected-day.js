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

    createReminder(reminder, gap) {
        const newReminder = {
            text: reminder.value
        };

        if (!reminder.value) {
            return;
        }

        if (this.repeatEnabled) {
            const dayGap = Number.parseInt(gap.value, 10);

            newReminder.year = this.selectedDay.year;
            newReminder.month = this.selectedDay.month;
            newReminder.day = this.selectedDay.number + dayGap;
            newReminder.gap = dayGap;
            newReminder.repeat = true;
            this.repeat.emit(newReminder);
            this.repeatEnabled = false;
            gap.value = "1";
        }
        this.selectedDay.reminders.push(newReminder);
        this.notify.emit(this.selectedDay);
        this.showReminderInput = false;
        reminder.value = "";
    }
}
