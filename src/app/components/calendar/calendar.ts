import { Component } from "@angular/core";
import { TimeDateService } from "../../services/timeDateService";
import { SettingService } from "../../services/settingService";

@Component({
    selector: "calendar",
    templateUrl: "./calendar.html"
})
export class Calendar {
    initialized: boolean = false;
    daySelected: boolean = false;
    timeDisplay: number = 1;
    currentDate: any = this.getCurrentDate();
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
            calendar.futureReminders =  calendar.futureReminders || [];
            this.repeatFutureReminders(calendar);
        }
        if (calendar.currentDay) {
            const day = calendar.currentDay;
            const previousDay = this.findDay(calendar[day.year][day.month], day.number);
            previousDay.isCurrentDay = false;
        }
        this.calendar = Object.assign(calendar, {
            currentYear: year,
            currentMonth: this.getCurrentMonth(calendar, year, month),
            currentDay: this.setCurrentDay(calendar, this.currentDate)
        });
        this.currentDay = this.calendar.currentDay;
        this.initialized = true;
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
        const currentDay = this.findDay(calendar[year][month], day);
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
        if (month === 0) {
            year -= 1;
        }
        return new Date(year, month, 0).getDate();
    }

    getFirstDayOfTheWeek(year, month) {
        const day = new Date(`${year}-${month + 1}-1`).getDay() - 1;

        return day === -1 ? 6 : day;
    }

    getYear(year) {
        const dayArray = Array(42).fill({});
        const monthArray = Array(12).fill(dayArray);

        return monthArray.map((month, monthIndex) => {
            const firstDayOfTheWeek = this.getFirstDayOfTheWeek(year, monthIndex);
            const daysInAMonth = this.getDaysInMonth(year, monthIndex + 1);
            let previousMonthDay = this.getDaysInMonth(year, monthIndex) - firstDayOfTheWeek;
            let currentMonthDay = 0;
            let nextMonthDay = 0;
            let excess = 0;

            return month.map((day, index) => {
                let direction = 0;
                let monthDay = 0;

                if (index < firstDayOfTheWeek) {
                    direction = -1;
                    excess += 1;
                    previousMonthDay += 1;
                    monthDay = previousMonthDay;
                }
                else if (index >= daysInAMonth + excess) {
                    direction = 1;
                    nextMonthDay += 1;
                    monthDay = nextMonthDay;
                }
                else {
                    currentMonthDay += 1;
                    monthDay = currentMonthDay;
                }

                return {
                    direction,
                    year,
                    month: monthIndex + direction,
                    number: monthDay,
                    reminders: []
                };
            });
        });
    }

    getCurrentMonth(calendar, year, month) {
        return {
            month,
            name: this.timeDateService.getMonth(month),
            days: calendar[year][month]
        };
    }

    repeatFutureReminders(calendar) {
        const { futureReminders } = calendar;
        let length = futureReminders.length;

        if (!length) {
            return;
        }

        while (length) {
            const [reminder] = futureReminders.splice(length - 1);

            this.repeatReminder(reminder, calendar);
            length -= 1;
        }
    }

    setCurrentMonthAndYear(direction) {
        let year = this.calendar.currentYear;
        let month = this.calendar.currentMonth.month;

        month += direction;
        if (month < 0) {
            month = 11;
            year -= 1;
        }
        else if (month > 11) {
            month = 0;
            year += 1;
        }

        if (!this.calendar[year]) {
            this.calendar[year] = this.getYear(year);

            if (direction === 1) {
                this.repeatFutureReminders(this.calendar);
            }
        }
        this.calendar.currentYear = year;
        this.calendar.currentMonth = this.getCurrentMonth(this.calendar, year, month);
    }

    findDay(days, day) {
        return days.find(localDay => localDay.direction === 0 && localDay.number === day);
    }

    getSelectedDay(selectedDay) {
        let year = this.calendar.currentYear;
        let month = selectedDay.month;

        if (month < 0) {
            this.setCurrentMonthAndYear(-1);
            year -= 1;
            month = 11;
        }
        else if (month > 11) {
            this.setCurrentMonthAndYear(1);
            year += 1;
            month = 0;
        }
        return this.findDay(this.calendar[year][month], selectedDay.number);
    }

    showDay(selectedDay) {
        if (selectedDay.direction === 0) {
            this.selectedDay = selectedDay;
        }
        else {
            this.selectedDay = this.getSelectedDay(selectedDay);
        }
        this.daySelected = true;
    }

    showCalendar(daySelected) {
        this.daySelected = daySelected;
    }

    filterReminders(reminders, text) {
        return reminders.filter(reminder => reminder.text !== text);
    }

    removeRepeatedReminder(reminder) {
        const years = Object.keys(this.calendar).filter(key => Number.parseInt(key, 10));
        const futureReminders = this.filterReminders(this.calendar.futureReminders, reminder.text);

        this.calendar.futureReminders = futureReminders;
        years.forEach(year => {
            this.calendar[year].forEach(month => {
                month.forEach(day => {
                    if (day.reminders.length) {
                        day.reminders = this.filterReminders(day.reminders, reminder.text);
                    }
                });
            });
        });
    }

    removeReminder(reminder) {
        if (reminder.repeat) {
            this.removeRepeatedReminder(reminder);
        }
        this.saveCalendar();
    }

    repeatNewReminder(reminder) {
        this.repeatReminder(reminder, this.calendar);
    }

    repeatReminder(reminder, calendar) {
        const year = calendar[reminder.year];
        const firstDayIndex = this.getFirstDayOfTheWeek(reminder.year, reminder.month);
        let dayIndex = reminder.day + firstDayIndex - 1;
        let monthIndex = reminder.month;
        let count = reminder.repeatCount;

        if (!year) {
            calendar.futureReminders.push(reminder);
            return;
        }

        while (monthIndex < year.length) {
            const currentMonth = year[monthIndex];
            monthIndex += 1;

            while (dayIndex < currentMonth.length) {
                const currentDay = currentMonth[dayIndex];

                if (currentDay.direction === 0) {
                    currentDay.reminders.push({
                        color: reminder.color,
                        text: reminder.text,
                        repeat: reminder.repeat,
                        rangeString: this.getReminderRangeString(reminder)
                    });
                    dayIndex += reminder.gap;

                    if (reminder.repeatCount > 0) {
                        count -= 1;

                        if (!count) {
                            return;
                        }
                    }
                }
                else if (monthIndex < 12) {
                    const firstDayIndex = this.getFirstDayOfTheWeek(reminder.year, monthIndex);

                    dayIndex = currentDay.number + firstDayIndex - 1;
                    break;
                }
                else {
                    reminder.year = reminder.year + 1;
                    reminder.month = 0;
                    reminder.day = currentDay.number;
                    reminder.repeatCount = count;

                    this.repeatReminder(reminder, calendar);
                    return;
                }
            }
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
