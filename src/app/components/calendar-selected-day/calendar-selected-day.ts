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

    RANGE_ERROR: string = "Please provide valid range";
    FORMAT_ERROR: string = "Please provide valid time format";
    isFormVisible: boolean = false;
    isRepeatEnabled: boolean = false;
    isGapInputValid: boolean = true;
    isRangeVisible: boolean = false;
    isRepeatCountInputEnabled: boolean = false;
    isRepeatCountInputValid: boolean = false;
    repeatGap: number = 1;
    repeatCount: number = 0;
    dateString: string = "";
    rangeMessage: string = this.FORMAT_ERROR;
    timePattern: string = "";
    occurences: string = "";
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
        this.isFormVisible = true;
    }

    hideReminderForm() {
        this.isFormVisible = false;
        this.isRangeVisible = false;
        this.isRepeatEnabled = false;
        this.isGapInputValid = true;

        this.resetRange();
        this.resetOccurencesInput();
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
        this.isRepeatEnabled = !this.isRepeatEnabled;

        if (!this.isRepeatEnabled) {
            this.resetOccurencesInput();
        }
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
        this.rangeMessage = this.FORMAT_ERROR;
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
            this.rangeMessage = this.FORMAT_ERROR;
            return;
        }

        if (!target.value && name === "to") {
            const regex = new RegExp(this.timePattern);

            if (!this.range.from.string) {
                this.rangeMessage = this.RANGE_ERROR;
            }
            else if (!regex.test(this.range.from.string)) {
                this.rangeMessage = this.FORMAT_ERROR;
            }
            else {
                this.rangeMessage = "";
            }
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

            if (!this.range.to.string) {
                this.rangeMessage = "";
                return;
            }

            if (regex.test(this.range.to.string)) {
                this.rangeMessage = "";
            }
        }
        const { from, to } = this.range;

        if (to.hours < from.hours || (to.hours === from.hours && to.minutes <= from.minutes)) {
            this.rangeMessage = this.RANGE_ERROR;
        }
    }

    resetOccurencesInput() {
        this.repeatCount = 0;
        this.isRepeatCountInputEnabled = false;
        this.isRepeatCountInputValid = false;
        this.occurences = "";
    }

    enableRepeatCountInput() {
        this.isRepeatCountInputEnabled = true;
    }

    validateRepeatCountInput({ target }) {
        this.isRepeatCountInputValid = target.validity.valid;

        if (this.isRepeatCountInputValid) {
            this.repeatCount = parseInt(target.value, 10);
        }
    }

    getRange() {
        if (!this.isRangeVisible) {
            return "All day";
        }
        return this.range.to.string ? this.range : this.range.from;
    }

    getRandomColor() {
        return "hsl(" + Math.random() * 360 + ", 100%, 72%)";
    }

    createReminder({ target }) {
        if (!target.checkValidity() || (this.isRangeVisible && this.rangeMessage)) {
            return;
        }
        const newReminder: any = {
            text: target.elements.reminder.value,
            range: this.getRange(),
            color: this.getRandomColor()
        };

        if (this.isRepeatEnabled) {
            newReminder.year = this.day.year;
            newReminder.month = this.day.month;
            newReminder.day = this.day.number + this.repeatGap;
            newReminder.gap = this.repeatGap;
            newReminder.repeatCount = this.repeatCount - 1;
            newReminder.repeat = true;
            this.repeat.emit(newReminder);
            this.isRepeatEnabled = false;
        }
        this.day.reminders.push(newReminder);
        this.update.emit();
        this.hideReminderForm();
    }
}
