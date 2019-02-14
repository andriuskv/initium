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
    sidebarCollapsed: boolean = false;
    inYearView: boolean = false;
    transitioning: boolean = false;
    transitionOriginX: number = 0;
    transitionOriginY: number = 0;
    timeFormat: number = 24;
    currentYear: number;
    futureReminders: Array<any> = [];
    currentDate: any = this.getCurrentDate();
    visibleMonth: any;
    currentDay: any;
    calendar: any;
    selectedDay: any;
    reminders = [];

    constructor(
        private reminderService: ReminderService,
        private timeDateService: TimeDateService,
        private settingService: SettingService
    ) {}

    ngOnInit() {
        this.initTimeSettings();
        this.initCalendar();
        this.initReminders();
        this.settingService.subscribeToSettingChanges(this.settingChangeHandler.bind(this));
    }

    ngOnChanges() {
        if (this.initialized && this.isHidden) {
            const { year, month } = this.currentDate;

            this.inYearView = false;
            this.selectedDay = null;
            this.currentYear = year;
            this.visibleMonth = this.getVisibleMonth(this.calendar, year, month);
        }
    }

    initTimeSettings() {
        const { format } = this.settingService.getSetting("time");

        this.timeFormat = format;
    }

    initCalendar() {
        const { year, month } = this.currentDate;

        this.calendar = {
            [year]: this.getYear(year)
        };
        this.currentYear = year;
        this.currentDay = this.setCurrentDay(this.calendar, this.currentDate);
        this.setCurrentMonth(this.calendar, this.currentDate);
        this.visibleMonth = this.getVisibleMonth(this.calendar, year, month);
        this.initialized = true;
    }

    async initReminders() {
        this.reminders = await this.reminderService.getReminders() as any;
        this.reminderService.subscribeToChanges(this.chromeStorageChangeHandler.bind(this));
        this.createReminders(this.reminders);
        this.updateIndicatorVisibility();
    }

    viewYear() {
        this.inYearView = true;
    }

    updateIndicatorVisibility() {
        this.reminderIndicatorVisible.emit(this.currentDay.reminders.length > 0);
    }

    changeSidebarSize() {
        this.sidebarCollapsed = !this.sidebarCollapsed;
    }

    getDay(calendar, { year, month, day }) {
        return calendar[year][month].days[day - 1];
    }

    setCurrentDay(calendar, date) {
        const day = this.getDay(calendar, date);
        const weekday = this.getWeekday(day.year, day.month, day.day);
        day.isCurrentDay = true;
        day.monthName = this.timeDateService.getMonth(day.month);
        day.weekdayName = this.timeDateService.getWeekday(weekday);

        return day;
    }

    setCurrentMonth(calendar, { year, month }) {
        calendar[year][month].isCurrentMonth = true;
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

    getWeekday(year, month, day) {
        return new Date(`${year}-${month + 1}-${day}`).getDay();
    }

    getFirstDayIndex(year, month) {
        const day = this.getWeekday(year, month, 1);

        return day === 0 ? 6 : day - 1;
    }

    getYear(year) {
        const months = [];

        for (let i = 0; i < 12; i++) {
            const daysInMonth = this.getDaysInMonth(year, i);
            const month = {
                firstDayIndex: this.getFirstDayIndex(year, i),
                name: this.timeDateService.getMonth(i),
                days: [],
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
        const { days, firstDayIndex, name } = calendar[year][month];

        return {
            previous: this.getPreviousMonth(calendar, year, month - 1, firstDayIndex),
            next: this.getNextMonth(calendar, year, month + 1, days.length, firstDayIndex),
            current: { name, month, days }
        };
    }

    repeatFutureReminders(reminders, calendar) {
        let { length } = reminders;

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

    setVisibleYear(direction) {
        const year = this.currentYear + direction;

        if (!this.calendar[year]) {
            this.calendar[year] = this.getYear(year);
            this.repeatFutureReminders(this.futureReminders, this.calendar);
        }
        this.currentYear = year;
    }

    makeTransition(callback, element, ...params) {
        this.transitionOriginX = element.offsetLeft + element.offsetWidth / 2;
        this.transitionOriginY = element.offsetTop + element.offsetHeight / 2;
        this.transitioning = true;

        window.setTimeout(() => {
            this.transitioning = false;
            callback.call(this, ...params);
        }, 320);
    }

    showMonth(index) {
        this.visibleMonth = this.getVisibleMonth(this.calendar, this.currentYear, index);
        this.inYearView = false;
    }

    showCalendar() {
        this.selectedDay = null;
    }

    getReminderIndex(id) {
        return this.reminders.findIndex(reminder => reminder.id === id);
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

    getReminderRepeatTooltip(gap, count) {
        return `Repeating ${count > 1 ? `${count} times ` : ""}every ${gap === 1 ? "day" : `${gap} days`}`;
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

    removeReminder(id) {
        const index = this.getReminderIndex(id);
        const [reminder] = this.reminders.splice(index, 1);

        if (reminder.repeat) {
            this.removeRepeatedReminder(reminder.id, this.calendar);
        }
        this.updateIndicatorVisibility();
        this.saveReminders();
    }

    updateReminder(data) {
        const index = this.getReminderIndex(data.id);

        Object.assign(this.reminders[index], data);
        this.saveReminders();
    }

    createReminders(reminders) {
        reminders.forEach(reminder => this.createReminder({ ...reminder }));
    }

    createReminder(reminder) {
        const { repeat, year, range } = reminder;
        reminder.rangeString = this.getReminderRangeString(range);

        if (year !== this.currentDate.year && !this.calendar[year]) {
            this.calendar[year] = this.getYear(year);
        }

        if (repeat) {
            reminder.tooltip = this.getReminderRepeatTooltip(reminder.gap, reminder.count);
            this.repeatReminder(reminder, this.calendar);
        }
        else {
            const day = this.getDay(this.calendar, reminder);

            day.reminders.push(reminder);
        }
    }

    handleReminderCreation(reminder) {
        this.reminders.push(reminder);
        this.createReminder({ ...reminder });
        this.updateIndicatorVisibility();
        this.saveReminders();
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

    saveReminders() {
        this.reminderService.saveReminders(this.reminders);
    }

    chromeStorageChangeHandler({ reminders }) {
        if (reminders) {
            this.reminders = reminders.newValue;

            this.initCalendar();
            this.createReminders(reminders.newValue);
            this.updateIndicatorVisibility();

            if (this.selectedDay) {
                this.showCalendar();
            }
        }
    }

    settingChangeHandler({ time }) {
        if (time) {
            this.timeFormat = time.format;
        }
    }
}
