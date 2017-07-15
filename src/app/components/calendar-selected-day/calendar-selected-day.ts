import { Component, Output, EventEmitter, Input } from "@angular/core";

@Component({
    selector: "calendar-selected-day",
    templateUrl: "./calendar-selected-day.html"
})
export class CalendarSelectedDay {
    @Output() event = new EventEmitter();
    @Output() save = new EventEmitter();
    @Output() remove = new EventEmitter();
    @Output() repeat = new EventEmitter();
    @Input() day: any = {};

    reminderInputEnabled: boolean = false;
    repeatEnabled: boolean = false;
    isValidInput: boolean = true;
    repeatGap: number = 0;

    showCalendar() {
        this.event.emit(false);
    }

    toggleReminderInput() {
        this.reminderInputEnabled = !this.reminderInputEnabled;
        this.repeatEnabled = false;
        this.isValidInput = true;
    }

    toggleRepeat() {
        this.repeatEnabled = !this.repeatEnabled;
    }

    removeReminder(index) {
        const [reminder] = this.day.reminders.splice(index, 1);

        this.remove.emit(reminder);
    }

    validateInput({ target }) {
        const value = target.value.trim();

        if (!value) {
            this.isValidInput = false;
            return;
        }
        this.isValidInput = value > 0 && /^[0-9]+$/g.test(value);

        if (this.isValidInput) {
            this.repeatGap = parseInt(value, 10);
        }
    }

    getRandomColor() {
        return "hsl(" + Math.random() * 360 + ", 100%, 72%)";
    }

    createReminder(reminder) {
        if (!reminder.value || !this.isValidInput) {
            return;
        }
        const newReminder: any = {
            text: reminder.value,
            color: this.getRandomColor()
        };

        if (this.repeatEnabled) {
            newReminder.year = this.day.year;
            newReminder.month = this.day.month;
            newReminder.day = this.day.number + this.repeatGap;
            newReminder.gap = this.repeatGap;
            newReminder.repeat = true;
            this.repeat.emit(newReminder);
            this.repeatEnabled = false;
        }
        this.day.reminders.push(newReminder);
        this.save.emit();
        this.reminderInputEnabled = false;
        reminder.value = "";
    }
}
