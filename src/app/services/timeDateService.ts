export class TimeDateService {
    getTime({ hours, minutes }, format) {
        let period = "";

        if (format === 12) {
            period = hours > 11 ? "PM" : "AM";

            if (!hours) {
                hours = 12;
            }
            else if (hours > 12) {
                hours -= 12;
            }
        }
        return {
            minutes,
            hours,
            period
        };
    }

    getTimeString(time, format) {
        const { hours, minutes, period } = this.getTime(time, format);

        return `${hours}:${`00${minutes}`.slice(-2)}${period && ` ${period}`}`;
    }

    getWeekday(day) {
        const weekdays = {
            0: "Sunday",
            1: "Monday",
            2: "Tuesday",
            3: "Wednesday",
            4: "Thursday",
            5: "Friday",
            6: "Saturday",
        };

        return weekdays[day];
    }

    getMonth(month, useShortName = false) {
        const months = {
            0: "January",
            1: "February",
            2: "March",
            3: "April",
            4: "May",
            5: "June",
            6: "July",
            7: "August",
            8: "September",
            9: "October",
            10: "November",
            11: "December"
        };

        return useShortName ? months[month].slice(0, 3) : months[month];
    }

    getDayWithSuffix(day) {
        if (day % 10 === 1 && day !== 11) {
            return `${day}st`;
        }
        else if (day % 10 === 2 && day !== 12) {
            return `${day}nd`;
        }
        else if (day % 10 === 3 && day !== 13) {
            return `${day}rd`;
        }
        return `${day}th`;
    }

    getCurrentDate() {
        const date = new Date();

        return {
            year: date.getFullYear(),
            month: date.getMonth(),
            day: date.getDate(),
            weekday: date.getDay()
        };
    }

    getDate(format, date = this.getCurrentDate()) {
        const map = {
            year: date.year,
            month: this.getMonth(date.month),
            day: this.getDayWithSuffix(date.day),
            weekday: this.getWeekday(date.weekday)
        };

        return format.replace(/\w+/g, item => map[item]);
    }
}
