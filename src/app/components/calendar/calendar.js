import { Component, Output, EventEmitter, Input } from "@angular/core";
import { DateService } from "./../../services/dateService";

@Component({
    selector: "calendar",
    templateUrl: "app/components/calendar/calendar.html"
})
export class Calendar {
    @Output() reminders = new EventEmitter();
    @Input() remidersDisabled;

    static get parameters() {
        return [[DateService]];
    }

    constructor(dateService) {
        this.initialized = false;
        this.notify = true;
        this.dateService = dateService;
        this.calendar = {};
        this.currentDate = this.getCurrentDate();
    }

    ngOnInit() {
        if (!this.initialized) {
            this.init();
        }
    }

    ngOnChanges(changes) {
        const disabled = changes.remidersDisabled.currentValue;

        if (!disabled) {
            if (!this.initialized) {
                this.init();
            }
            const day = this.getCurrentDayInCalendar(this.calendar, this.currentDate);

            this.reminders.emit(day.reminders);
        }
        this.notify = !disabled;
    }

    init() {
        const calendar = JSON.parse(localStorage.getItem("calendar")) || {};
        const year = this.currentDate.year;
        const month = this.currentDate.month;

        if (!calendar[year]) {
            calendar[year] = this.getYear(year);
        }
        if (calendar.currentDay) {
            const day = calendar.currentDay;

            calendar[day.year][day.month][day.index].currentDay = false;
        }
        this.calendar = Object.assign(calendar, {
            currentYear: year,
            currentMonth: this.getCurrentMonth(calendar, year, month),
            currentDay: this.setCurrentDay(calendar, this.currentDate),
            futureReminders: calendar.futureReminders || []
        });
        this.repeatFutureReminders(calendar.futureReminders);
        this.initialized = true;
    }

    setCurrentDay(calendar, date) {
        const currentDay = this.getCurrentDayInCalendar(calendar, date);
        const currentMonth = calendar[date.year][date.month];

        for (let i = 0; i < currentMonth.length; i += 1) {
            const day = currentMonth[i];

            if (day.direction === 0 && day.number === currentDay.number) {
                day.currentDay = true;
                return {
                    index: i,
                    month: date.month,
                    year: date.year
                };
            }
        }
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

    getSelectedDayDate(month, day) {
        const monthName = this.dateService.getMonth(month);
        const dayWithSuffix = this.dateService.getDayWithSuffix(day);

        return `${monthName} ${dayWithSuffix}`;
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

                const realMonth = monthIndex + direction;

                return {
                    direction,
                    year,
                    month: realMonth,
                    number: monthDay,
                    date: this.getSelectedDayDate(realMonth, monthDay),
                    reminders: []
                };
            });
        });
    }

    getCurrentMonth(calendar, year, month) {
        return {
            month,
            name: this.dateService.getMonth(month),
            days: calendar[year][month]
        };
    }

    repeatFutureReminders(futureReminders) {
        let length = futureReminders.length;

        if (!length) {
            return;
        }

        while (length) {
            const [reminder] = futureReminders.splice(length - 1);

            this.repeatReminder(reminder);
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
                this.repeatFutureReminders(this.calendar.futureReminders);
            }
        }
        this.calendar.currentYear = year;
        this.calendar.currentMonth = this.getCurrentMonth(this.calendar, year, month);
    }

    getCurrentDayInCalendar(calendar, { year, month, day }) {
        const days = calendar[year][month];

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
        return this.calendar[year][month]
            .find(day => day.number === selectedDay.number && day.direction === 0);
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

    sendReminders(selectedDay) {
        if (selectedDay.currentDay && this.notify) {
            this.reminders.emit(selectedDay.reminders);
        }
        localStorage.setItem("calendar", JSON.stringify(this.calendar));
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
        if (this.notify) {
            const day = this.getCurrentDayInCalendar(this.calendar, this.currentDate);

            this.reminders.emit(day.reminders);
        }
        localStorage.setItem("calendar", JSON.stringify(this.calendar));
    }

    repeatReminder(reminder) {
        const year = this.calendar[reminder.year];
        const firstDayIndex = this.getFirstDayOfTheWeek(reminder.year, reminder.month);
        let dayIndex = reminder.day + firstDayIndex - 1;
        let monthIndex = reminder.month;

        if (!year) {
            return;
        }

        while (monthIndex < year.length) {
            const currentMonth = year[monthIndex];

            monthIndex += 1;
            while (dayIndex < currentMonth.length) {
                const currentDay = currentMonth[dayIndex];

                if (currentDay.direction === 0) {
                    currentDay.reminders.push({
                        text: reminder.text,
                        repeat: reminder.repeat
                    });
                    dayIndex += reminder.gap;
                }
                else if (monthIndex < 12) {
                    const firstDayIndex = this.getFirstDayOfTheWeek(reminder.year, monthIndex);

                    dayIndex = currentDay.number + firstDayIndex - 1;
                    break;
                }
                else {
                    const nextYear = reminder.year + 1;

                    reminder.year = nextYear;
                    reminder.month = 0;
                    reminder.day = currentDay.number;

                    if (!this.calendar[nextYear]) {
                        this.calendar.futureReminders.push(reminder);
                    }
                    else {
                        this.repeatReminder(reminder);
                    }
                    return;
                }
            }
        }
    }
}
