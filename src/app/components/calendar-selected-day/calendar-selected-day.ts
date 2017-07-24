import { Component, Output, EventEmitter, Input } from "@angular/core";
import { TimeDateService } from "../../services/timeDateService";

@Component({
    selector: "calendar-selected-day",
    templateUrl: "./calendar-selected-day.html"
})
export class CalendarSelectedDay {
    @Output() event = new EventEmitter();
    @Output() update = new EventEmitter();
    @Output() remove = new EventEmitter();
    @Output() repeat = new EventEmitter();
    @Input() day: any = {};
    @Input() timeDisplay: number;

    formVisible: boolean = false;
    repeatEnabled: boolean = false;
    isGapInputValid: boolean = true;
    isRangeVisible: boolean = false;
    repeatGap: number = 0;
    dateString: string = "";
    rangeMessage: string = "Please provide valid range";
    timePattern: string = "";
    range: any = {
        from: {},
        to: {}
    };
    timeTable: Array<any> = [];

    constructor(private timeDateService: TimeDateService) {
        this.timeDateService = timeDateService;
    }

    ngOnInit() {
        this.dateString = this.getDateString(this.day);
        this.timePattern = this.timeDisplay ?
            "^(([0-1]?[0-9])|(2[0-3])):[0-5]?[0-9]$" :
            "^((0?[1-9])|(1[0-2])):[0-5]?[0-9] ?[a|p|A|P][m|M]$";
        this.timeTable = this.generateTimeTable(this.timeDisplay);
    }

    showCalendar() {
        this.event.emit(false);
    }

    showReminderForm() {
        this.formVisible = true;
    }

    hideReminderForm() {
        this.formVisible = false;
        this.isRangeVisible = false;
        this.repeatEnabled = false;
        this.isGapInputValid = true;

        this.resetRange();
    }

    getDateString({ year, month, number }) {
        const monthName = this.timeDateService.getMonth(month);
        const dayWithSuffix = this.timeDateService.getDayWithSuffix(number);

        return `${monthName} ${dayWithSuffix}, ${year}`;
    }

    toggleRange() {
        this.isRangeVisible = !this.isRangeVisible;

        if (!this.isRangeVisible) {
            this.resetRange();
        }
    }

    toggleRepeat() {
        this.repeatEnabled = !this.repeatEnabled;
    }

    removeReminder(index) {
        const [reminder] = this.day.reminders.splice(index, 1);

        this.remove.emit(reminder);
    }

    validateGapInput({ target }) {
        this.isGapInputValid = target.validity.valid;

        if (this.isGapInputValid) {
            this.repeatGap = parseInt(target.value, 10);
        }
    }

    resetRange() {
        this.range = {
            from: {},
            to: {}
        };
        this.rangeMessage = "Please provide valid range";
    }

    generateTimeTable(timeDisplay) {
        const dataList = [];
        let minutes = 0;
        let hours = 0;

        while (hours < 24) {
            dataList.push({
                string: this.timeDateService.getTimeString({ hours, minutes }, timeDisplay),
                hours,
                minutes
            });
            minutes += 30;

            if (minutes === 60) {
                hours += 1;
                minutes = 0;
            }
        }
        return dataList;
    }

    validateRangeInput({ target }, name) {
        if (!target.validity.valid) {
            this.rangeMessage = "Please provide valid time format";
            return;
        }
        const time = this.range[name];
        const [hourString, minuteString] = time.string.toLowerCase().split(":");
        const hours = parseInt(hourString, 10);
        time.minutes = parseInt(minuteString, 10);
        this.rangeMessage = "";

        if (this.timeDisplay) {
            time.hours = hours;
        }
        else if (minuteString.endsWith("am") && hours === 12) {
            time.hours = 0;
        }
        else if (minuteString.endsWith("pm") && hours !== 12) {
            time.hours = hours + 12;
        }
        else {
            time.hours = hours;
        }
        this.updateTimeRange(time, name);
    }

    updateTimeRange(time, name) {
        const regex = new RegExp(this.timePattern);

        if (name === "to") {
            this.range.to = Object.assign({}, time);

            if (regex.test(this.range.from.string)) {
                this.rangeMessage = "";
            }
        }
        else {
            this.range.from = Object.assign({}, time);

            if (regex.test(this.range.to.string)) {
                this.rangeMessage = "";
            }
        }
        const { from, to } = this.range;

        if (to.hours < from.hours || (to.hours === from.hours && to.minutes <= from.minutes)) {
            this.rangeMessage = "Please provide valid range";
        }
    }

    getRange() {
        if (!this.isRangeVisible) {
            return "All day";
        }
        return this.range;
    }

    getRandomColor() {
        return "hsl(" + Math.random() * 360 + ", 100%, 72%)";
    }

    createReminder(reminder) {
        if (!reminder.value || !this.isGapInputValid || (this.isRangeVisible && this.rangeMessage)) {
            return;
        }
        const newReminder: any = {
            text: reminder.value,
            range: this.getRange(),
            color: this.getRandomColor()
        };

        if (this.repeatEnabled && this.repeatGap) {
            newReminder.year = this.day.year;
            newReminder.month = this.day.month;
            newReminder.day = this.day.number + this.repeatGap;
            newReminder.gap = this.repeatGap;
            newReminder.repeat = true;
            this.repeat.emit(newReminder);
            this.repeatEnabled = false;
        }
        this.day.reminders.push(newReminder);
        this.update.emit();
        this.hideReminderForm();
        reminder.value = "";
    }
}
