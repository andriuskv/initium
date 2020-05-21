import { Component, Output, EventEmitter, Input } from "@angular/core";
import { TimeDateService } from "../../services/timeDateService";
import { SettingService } from "../../services/settingService";
import { getRandomHslColor } from "../../utils/utils";

@Component({
    selector: "calendar-selected-day",
    templateUrl: "./calendar-selected-day.html"
})
export class CalendarSelectedDay {
    @Output() event = new EventEmitter();
    @Output() remove = new EventEmitter();
    @Output() create = new EventEmitter();
    @Output() update = new EventEmitter();
    @Input() reminders = [];
    @Input() day: any = {};

    RANGE_ERROR = "Please provide valid range";
    FORMAT_ERROR = "Please provide valid time format";
    isFormVisible = false;
    isRepeatEnabled = false;
    isGapInputValid = true;
    isRangeVisible = false;
    isRepeatCountInputEnabled = false;
    isRepeatCountInputValid = false;
    timeFormat = 24;
    repeatGap = 1;
    repeatCount = 0;
    dateString = "";
    rangeMessage = this.FORMAT_ERROR;
    timePattern = "";
    occurences = "";
    range: any = {
        from: {
            string: ""
        },
        to: {
            string: ""
        }
    };
    timeTable: any = {};

    constructor(private timeDateService: TimeDateService, private settingService: SettingService) {}

    ngOnInit() {
        const { format } = this.settingService.getSetting("time");

        this.dateString = this.timeDateService.getDate("month day, year", this.day);
        this.timeFormat = format;
        this.timePattern = this.getTimePattern(format);
    }

    getTimePattern(format) {
        return format === 24 ?
            "^(([0-1]?[0-9])|(2[0-3])):[0-5]?[0-9]$" :
            "^((0?[1-9])|(1[0-2])):[0-5]?[0-9] ?[a|p|A|P][m|M]$";
    }

    showCalendar() {
        this.event.emit();
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

    validateGapInput({ target }) {
        this.isGapInputValid = target.validity.valid;

        if (this.isGapInputValid) {
            this.repeatGap = parseInt(target.value, 10);
        }
    }

    resetRange() {
        this.range = {
            from: {
                string: ""
            },
            to: {
                string: ""
            }
        };
        this.rangeMessage = this.FORMAT_ERROR;
    }

    generateTimeTable() {
        const timeTable = {
            format: this.timeFormat,
            items: [{ string: "" } as any]
        };
        let minutes = 0;
        let hours = 0;

        if (this.timeTable.format === timeTable.format) {
            return;
        }

        while (hours < 24) {
            timeTable.items.push({
                string: this.timeDateService.getTimeString({ hours, minutes }, this.timeFormat),
                hours,
                minutes
            });
            minutes += 30;

            if (minutes === 60) {
                hours += 1;
                minutes = 0;
            }
        }
        this.timeTable = { ...timeTable };
    }

    parseTimeString(string) {
        const [hourString, minuteString] = string.toLowerCase().split(":");
        const minutes = parseInt(minuteString, 10);
        let hours = parseInt(hourString, 10);

        if (this.timeFormat === 24) {
            hours = hours;
        }
        else if (minuteString.endsWith("am") && hours === 12) {
            hours = 0;
        }
        else if (minuteString.endsWith("pm") && hours !== 12) {
            hours = hours + 12;
        }
        else {
            hours = hours;
        }

        return { hours, minutes };
    }

    validateRangeInput({ target }, name) {
        if (target.validity.valid) {
            this.rangeMessage = "";
        }
        else {
            this.rangeMessage = this.FORMAT_ERROR;

            if (name === "from" && !target.value) {
                this.range[name].string = "";
            }
            return;
        }
        let time = this.range[name];
        time.string = target.value;

        if (target.value) {
            time = { ...time, ...this.parseTimeString(target.value) };
        }
        this.updateTimeRange(time, name);
    }

    updateTimeRange(time, name) {
        this.range[name] = { ...time };

        if (!this.range.from.string) {
            this.rangeMessage = this.FORMAT_ERROR;
            return;
        }

        if (!this.range.to.string) {
            this.rangeMessage = "";
            return;
        }
        const regex = new RegExp(this.timePattern);
        const { from, to } = this.range;

        if (regex.test(time.string)) {
            this.rangeMessage = "";
        }

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
            this.occurences = target.value;
            this.repeatCount = parseInt(target.value, 10);
        }
    }

    getRange() {
        return this.isRangeVisible ? this.range : -1;
    }

    getRandomColor() {
        const { hue, saturation, lightness } = getRandomHslColor();
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    changeReminderColor(reminder) {
        const color = this.getRandomColor();
        reminder.color = color;

        this.update.emit({
            id: reminder.id,
            color
        });
    }

    getId() {
        return Math.random().toString(32).slice(2, 16);
    }

    createReminder(event) {
        event.preventDefault();

        if (!event.target.checkValidity() || (this.isRangeVisible && this.rangeMessage)) {
            return;
        }
        const reminder = {
            id: this.getId(),
            text: event.target.elements.reminder.value,
            color: this.getRandomColor(),
            range: this.getRange(),
            repeat: this.isRepeatEnabled && (!this.repeatCount || this.repeatCount > 1),
            year: this.day.year,
            month: this.day.month,
            day: this.day.day
        };

        if (reminder.repeat) {
            Object.assign(reminder, {
                gap: this.repeatGap,
                count: this.repeatCount
            });
        }
        this.create.emit(reminder);
        this.hideReminderForm();
    }

    removeReminder(id, index) {
        this.day.reminders.splice(index, 1);
        this.remove.emit(id);
    }
}
