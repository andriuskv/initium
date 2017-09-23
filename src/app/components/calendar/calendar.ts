import { Component } from "@angular/core";
import { TimeDateService } from "../../services/timeDateService";
import { SettingService } from "../../services/settingService";

@Component({
    selector: "calendar",
    templateUrl: "./calendar.html"
})
export class Calendar {
    daySelected: boolean = false;
    timeDisplay: number = 1;
    currentDate: any = this.getCurrentDate();
    visibleMonth: any;
    currentDay: any;
    calendar: any;
    selectedDay: any;

    constructor(private timeDateService: TimeDateService, private settingService: SettingService) {
        this.timeDateService = timeDateService;
        this.settingService = settingService;
    }

    ngOnInit() {
        const { time: settings } = this.settingService.getSettings();

        this.timeDisplay = parseInt(settings.timeDisplay, 10);
        this.init();
    }

    init() {
        const calendar = JSON.parse(localStorage.getItem("calendar")) || {};
        const year = this.currentDate.year;
        const month = this.currentDate.month;

        if (!calendar[year]) {
            calendar[year] = this.getYear(year);
            calendar.futureReminders = calendar.futureReminders || [];
            this.repeatFutureReminders(calendar);
        }

        if (calendar.currentDay) {
            const day = calendar.currentDay;
            const previousDay = calendar[day.year][day.month].days[day.number - 1];
            previousDay.isCurrentDay = false;
        }
        this.calendar = Object.assign(calendar, {
            currentYear: year,
            currentDay: this.setCurrentDay(calendar, this.currentDate)
        });
        this.visibleMonth = this.getVisibleMonth(calendar, year, month);
        this.currentDay = this.calendar.currentDay;
    }

    getReminderRangeString(reminder) {
        const range = reminder.range;

        if (typeof range === "string") {
            return range;
        }
        else if (range.to) {
            const fromString = this.timeDateService.getTimeString(range.from, this.timeDisplay);
            const toString = this.timeDateService.getTimeString(range.to, this.timeDisplay);

            return `${fromString} - ${toString}`;
        }
        return this.timeDateService.getTimeString(range, this.timeDisplay);
    }

    setCurrentDay(calendar, { year, month, day }) {
        const currentDay = calendar[year][month].days[day - 1];
        currentDay.isCurrentDay = true;

        return currentDay;
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
                    number: j + 1,
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
            days: calendar[year][0].days.slice(0, 42 - daysInMonth - index)
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

    repeatFutureReminders(calendar) {
        const { futureReminders } = calendar;
        let length = futureReminders.length;

        if (!length) {
            return;
        }

        while (length) {
            const [reminder] = futureReminders;

            if (calendar[reminder.year]) {
                futureReminders.splice(0, 1);
                this.repeatReminder(reminder, calendar);
            }
            length -= 1;
        }
    }

    setVisibleMonth(direction) {
        let year = this.calendar.currentYear;
        let month = this.visibleMonth.current.month + direction;

        if (month < 0) {
            month = 11;
            year -= 1;
        }
        else if (month > 11) {
            month = 0;
            year += 1;

            this.repeatFutureReminders(this.calendar);
            this.saveCalendar();
        }
        this.calendar.currentYear = year;
        this.visibleMonth = this.getVisibleMonth(this.calendar, year, month);
    }

    showDay(day, direction = 0) {
        this.selectedDay = day;
        this.daySelected = true;

        if (direction) {
            this.setVisibleMonth(direction);
        }
    }

    showCalendar() {
        this.daySelected = false;
    }

    filterReminders(reminders, text) {
        return reminders.filter(reminder => reminder.text !== text);
    }

    removeRepeatedReminder(calendar, reminder) {
        const years = Object.keys(calendar).filter(key => Number.parseInt(key, 10));
        calendar.futureReminders = this.filterReminders(calendar.futureReminders, reminder.text);

        years.forEach(year => {
            calendar[year].forEach(month => {
                month.days.forEach(day => {
                    if (day.reminders.length) {
                        day.reminders = this.filterReminders(day.reminders, reminder.text);
                    }
                });
            });
        });
    }

    removeReminder(reminder) {
        if (reminder.repeat) {
            this.removeRepeatedReminder(this.calendar, reminder);
        }
        this.saveCalendar();
    }

    repeatNewReminder(reminder) {
        this.repeatReminder(reminder, this.calendar);
        this.saveCalendar();
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
        const gap = reminder.gap;
        const months = calendar[reminder.year];
        let monthIndex = reminder.month;
        let dayIndex = reminder.day - 1;
        let month = months[monthIndex];
        let day = month.days[dayIndex];

        while (true) {
            if (!day) {
                const date = this.getNextReminderDate(calendar, reminder.year, monthIndex, dayIndex);

                if (date.year > reminder.year) {
                    reminder.year = date.year;
                    reminder.month = date.month;
                    reminder.day = date.day;

                    if (calendar[date.year]) {
                        this.repeatReminder(reminder, calendar);
                    }
                    else {
                        calendar.futureReminders.push(reminder);
                    }
                    return;
                }
                dayIndex = date.day - 1;
                monthIndex = date.month;
                month = months[monthIndex];
                day = month.days[dayIndex];
            }
            day.reminders.push({
                color: reminder.color,
                text: reminder.text,
                repeat: reminder.repeat,
                rangeString: this.getReminderRangeString(reminder)
            });

            if (reminder.repeatCount > 0) {
                reminder.repeatCount -= 1;

                if (!reminder.repeatCount) {
                    return;
                }
            }
            dayIndex += gap;
            day = month.days[dayIndex];
        }
    }

    updateReminder() {
        const day = this.selectedDay;
        const reminder = day.reminders[day.reminders.length - 1];

        reminder.rangeString = this.getReminderRangeString(reminder);
        this.saveCalendar();
    }

    saveCalendar() {
        localStorage.setItem("calendar", JSON.stringify(this.calendar));
    }
}
