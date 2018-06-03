import { Component, Output, EventEmitter, Input } from "@angular/core";
import { ReminderService } from "../../services/reminderService";
import { TimeDateService } from "../../services/timeDateService";
import { SettingService } from "../../services/settingService";

@Component({
    selector: "calendar",
    templateUrl: "./calendar.html"
})
export class Calendar {
    @Input() isHidden = true;
    @Output() reminderIndicatorVisible = new EventEmitter();

    initialized: boolean = false;
    remindersCollapsed: boolean = false;
    timeFormat: number = 24;
    currentYear: number;
    futureReminders: Array<any> = [];
    currentDate: any = this.getCurrentDate();
    visibleMonth: any;
    currentDay: any;
    calendar: any;
    selectedDay: any;

    constructor(
        private reminderService: ReminderService,
        private timeDateService: TimeDateService,
        private settingService: SettingService
    ) {}

    ngOnInit() {
        this.initTimeSettings();
        this.initCalendar();
        this.initReminders();
    }

    ngOnChanges() {
        if (this.initialized && this.isHidden) {
            const { year, month } = this.currentDate;

            this.selectedDay = null;
            this.currentYear = year;
            this.visibleMonth = this.getVisibleMonth(this.calendar, year, month);
        }
    }

    initTimeSettings() {
        const { format } = this.settingService.getSetting("time");

        this.timeFormat = format;
        this.settingService.subscribeToChanges(this.timeSettingChangeHandler.bind(this));
    }

    initCalendar() {
        const { year, month } = this.currentDate;

        this.calendar = {
            [year]: this.getYear(year)
        };
        this.currentYear = year;
        this.currentDay = this.setCurrentDay(this.calendar, this.currentDate);
        this.visibleMonth = this.getVisibleMonth(this.calendar, year, month);
        this.initialized = true;
    }

    async initReminders() {
        const reminders: any = await this.reminderService.getReminders();

        this.reminderService.subscribeToChanges(this.chromeStorageChangeHandler.bind(this));
        this.createReminders(reminders);
        this.updateIndicatorVisibility();
    }

    updateIndicatorVisibility() {
        this.reminderIndicatorVisible.emit(this.currentDay.reminders.length > 0);
    }

    changeReminderSize() {
        this.remindersCollapsed = !this.remindersCollapsed;
    }

    getDay(calendar, { year, month, day }) {
        return calendar[year][month].days[day - 1];
    }

    setCurrentDay(calendar, date) {
        const day = this.getDay(calendar, date);
        day.isCurrentDay = true;

        return day;
    }

    getCurrentDate() {
        const date = new Date();

        return {
            year: date.getFullYear(),
            month: date.getMonth(),
            day: date.getDate()
        };
    }

    getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    getFirstDayIndex(year, month) {
        const day = new Date(`${year}-${month + 1}-1`).getDay() - 1;

        return day === -1 ? 6 : day;
    }

    getYear(year) {
        const months = [];

        for (let i = 0; i < 12; i++) {
            const daysInMonth = this.getDaysInMonth(year, i);
            const month = {
                firstDayIndex: this.getFirstDayIndex(year, i),
                days: []
            };

            for (let j = 0; j < daysInMonth; j++) {
                month.days.push({
                    year,
                    month: i,
                    day: j + 1,
                    reminders: []
                });
            }
            months.push(month);
        }
        return months;
    }

    getPreviousMonth(calendar, year, month, index) {
        if (month < 0) {
            year -= 1;
            month = 11;
            calendar[year] = calendar[year] || this.getYear(year);
        }
        return {
            days: index ? calendar[year][month].days.slice(-index) : []
        };
    }

    getNextMonth(calendar, year, month, daysInMonth, index) {
        if (month > 11) {
            year += 1;
            month = 0;
            calendar[year] = calendar[year] || this.getYear(year);
        }
        return {
            days: calendar[year][month].days.slice(0, 42 - daysInMonth - index)
        };
    }

    getVisibleMonth(calendar, year, month) {
        const { days, firstDayIndex } = calendar[year][month];

        return {
            previous: this.getPreviousMonth(calendar, year, month - 1, firstDayIndex),
            next: this.getNextMonth(calendar, year, month + 1, days.length, firstDayIndex),
            current: {
                name: this.timeDateService.getMonth(month),
                month,
                days
            }
        };
    }

    repeatFutureReminders(reminders, calendar) {
        let length = reminders.length;

        if (!length) {
            return;
        }

        while (length) {
            const [reminder] = reminders;

            if (calendar[reminder.year]) {
                reminders.splice(0, 1);
                this.repeatReminder(reminder, calendar);
            }
            length -= 1;
        }
    }

    setVisibleMonth(direction) {
        let year = this.currentYear;
        let month = this.visibleMonth.current.month + direction;

        if (month < 0) {
            month = 11;
            year -= 1;
        }
        else if (month > 11) {
            month = 0;
            year += 1;

            this.repeatFutureReminders(this.futureReminders, this.calendar);
        }
        this.currentYear = year;
        this.visibleMonth = this.getVisibleMonth(this.calendar, year, month);
    }

    showDay(day, direction = 0) {
        this.selectedDay = day;

        if (direction) {
            this.setVisibleMonth(direction);
        }
    }

    showCalendar() {
        this.selectedDay = null;
    }

    getReminderRangeString(range) {
        if (range === -1) {
            return "All day";
        }
        else if (range.to.string) {
            const fromString = this.timeDateService.getTimeString(range.from, this.timeFormat);
            const toString = this.timeDateService.getTimeString(range.to, this.timeFormat);

            return `${fromString} - ${toString}`;
        }
        return this.timeDateService.getTimeString(range.from, this.timeFormat);
    }

    filterReminders(reminders, id) {
        return reminders.filter(reminder => reminder.id !== id);
    }

    removeRepeatedReminder(id, calendar) {
        this.futureReminders = this.filterReminders(this.futureReminders, id);

        Object.keys(calendar).forEach(year => {
            calendar[year].forEach(month => {
                month.days.forEach(day => {
                    if (day.reminders.length) {
                        day.reminders = this.filterReminders(day.reminders, id);
                    }
                });
            });
        });
    }

    removeReminder(reminder) {
        if (reminder.repeat) {
            this.removeRepeatedReminder(reminder.id, this.calendar);
        }
        else {
            this.selectedDay.reminders = this.filterReminders(this.selectedDay.reminders, reminder.id);
        }
        this.updateIndicatorVisibility();
    }

    createReminders(reminders) {
        reminders.forEach(reminder => this.createReminder(reminder));
    }

    createReminder(reminder) {
        const { repeat, year } = reminder;
        reminder.rangeString = this.getReminderRangeString(reminder.range);

        if (year !== this.currentDate.year && !this.calendar[year]) {
            this.calendar[year] = this.getYear(year);
        }

        if (repeat) {
            this.repeatReminder({ ...reminder }, this.calendar);
        }
        else {
            const day = this.getDay(this.calendar, reminder);

            day.reminders.push(reminder);
        }
    }

    handleReminderCreation(reminder) {
        this.createReminder(reminder);
        this.updateIndicatorVisibility();
    }

    getNextReminderDate(calendar, year, monthIndex, dayIndex) {
        let months = calendar[year];
        let month = months[monthIndex];

        while (dayIndex > month.days.length - 1) {
            monthIndex += 1;
            dayIndex -= month.days.length;

            if (monthIndex > 11) {
                year += 1;
                monthIndex = 0;
                months = calendar[year];

                if (!months) {
                    break;
                }
            }
            month = months[monthIndex];
        }
        return {
            day: dayIndex + 1,
            month: monthIndex,
            year
        };
    }

    repeatReminder(reminder, calendar) {
        const months = calendar[reminder.year];
        let monthIndex = reminder.month;
        let dayIndex = reminder.day - 1;
        let month = months[monthIndex];
        let day = month.days[dayIndex];

        while (true) {
            if (!day) {
                const date = this.getNextReminderDate(calendar, reminder.year, monthIndex, dayIndex);

                if (date.year > reminder.year) {
                    Object.assign(reminder, date);

                    if (calendar[date.year]) {
                        this.repeatReminder(reminder, calendar);
                    }
                    else {
                        this.futureReminders.push(reminder);
                    }
                    return;
                }
                dayIndex = date.day - 1;
                monthIndex = date.month;
                month = months[monthIndex];
                day = month.days[dayIndex];
            }
            day.reminders.push(reminder);

            if (reminder.count > 0) {
                reminder.count -= 1;

                if (!reminder.count) {
                    return;
                }
            }
            dayIndex += reminder.gap;
            day = month.days[dayIndex];
        }
    }

    timeSettingChangeHandler({ time }) {
        if (time && time.format) {
            this.timeFormat = time.format;

            this.currentDay.reminders = this.currentDay.reminders.map(reminder => {
                reminder.rangeString = this.getReminderRangeString(reminder.range);

                return reminder;
            });
        }
    }

    chromeStorageChangeHandler({ reminders }) {
        if (reminders) {
            this.initCalendar();
            this.createReminders(reminders.newValue);
            this.updateIndicatorVisibility();

            if (this.selectedDay) {
                this.showCalendar();
            }
        }
    }
}
