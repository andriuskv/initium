import { Component, Output, EventEmitter, Input } from "@angular/core";
import { ReminderService } from "../../services/reminderService";
import { TimeDateService } from "../../services/timeDateService";

@Component({
    selector: "calendar-selected-day",
    templateUrl: "./calendar-selected-day.html"
})
export class CalendarSelectedDay {
    @Output() event = new EventEmitter();
    @Output() remove = new EventEmitter();
    @Output() create = new EventEmitter();
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
        from: {
            string: ""
        },
        to: {
            string: ""
        }
    };
    reminders: any;
    timeTable: Array<any> = [];

    constructor(private reminderService: ReminderService, private timeDateService: TimeDateService) {
        this.reminderService = reminderService;
        this.timeDateService = timeDateService;
    }

    ngOnInit() {
        this.dateString = this.getDateString(this.day);
        this.timePattern = this.timeDisplay ?
            "^(([0-1]?[0-9])|(2[0-3])):[0-5]?[0-9]$" :
            "^((0?[1-9])|(1[0-2])):[0-5]?[0-9] ?[a|p|A|P][m|M]$";
        this.timeTable = this.generateTimeTable(this.timeDisplay);

        this.getReminders();
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
        time.string = target.value;
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
            this.occurences = target.value;
            this.repeatCount = parseInt(target.value, 10);
        }
    }

    getRange() {
        return this.isRangeVisible ? this.range : -1;
    }

    getRandomColor() {
        const num = Math.floor(Math.random() * 360) + 1;
        return `hsl(${num}, 100%, 72%)`;
    }

    changeReminderColor(reminder) {
        const color = this.getRandomColor();
        reminder.color = color;

        this.updateReminder({
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
        const data: any = {
            reminder: {
                id: this.getId(),
                text: event.target.elements.reminder.value,
                color: this.getRandomColor(),
                range: this.getRange(),
                repeat: this.isRepeatEnabled && (!this.repeatCount || this.repeatCount > 1)
            },
            repeatData: {
                year: this.day.year,
                month: this.day.month,
                day: this.day.number
            }
        };

        if (data.reminder.repeat) {
            Object.assign(data.repeatData, {
                gap: this.repeatGap,
                count: this.repeatCount
            });
        }

        this.addReminder(data);
        this.create.emit(data);
        this.hideReminderForm();
    }

    async getReminders() {
        this.reminders = await this.reminderService.getReminders();
    }

    getReminderIndex(id) {
        return this.reminders.findIndex(({ reminder }) => reminder.id === id);
    }

    addReminder(reminder) {
        this.reminders.push(reminder);
        this.saveReminders();
    }

    removeReminder(id) {
        const index = this.getReminderIndex(id);
        const [{ reminder }] = this.reminders.splice(index, 1);

        this.remove.emit(reminder);
        this.saveReminders();
    }

    updateReminder(data) {
        const index = this.getReminderIndex(data.id);
        const { reminder } = this.reminders[index];

        Object.assign(reminder, data);
        this.saveReminders();
    }

    saveReminders() {
        this.reminderService.saveReminders(this.reminders);
    }
}
