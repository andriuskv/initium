export class DateService {
    getDay(day) {
        switch (day) {
            case 0:
                return "Sunday";
            case 1:
                return "Monday";
            case 2:
                return "Tuesday";
            case 3:
                return "Wednesday";
            case 4:
                return "Thursday";
            case 5:
                return "Friday";
            case 6:
                return "Saturday";
        }
    }

    getMonth(month) {
        switch (month) {
            case 0:
                return "January";
            case 1:
                return "February";
            case 2:
                return "March";
            case 3:
                return "April";
            case 4:
                return "May";
            case 5:
                return "June";
            case 6:
                return "July";
            case 7:
                return "August";
            case 8:
                return "September";
            case 9:
                return "October";
            case 10:
                return "November";
            case 11:
                return "December";
        }
    }

    getDayWithSuffix(day) {
        if (day % 10 === 1 && day !== 11) {
            return day + "st";
        }
        else if (day % 10 === 2 && day !== 12) {
            return day + "nd";
        }
        else if (day % 10 === 3 && day !== 13) {
            return day + "rd";
        }
        return day + "th";
    }

    getDate() {
        const date = new Date();
        const dayOfTheWeek = this.getDay(date.getDay());
        const month = this.getMonth(date.getMonth());
        const day = this.getDayWithSuffix(date.getDate());

        return `${dayOfTheWeek}, ${month} ${day}`;
    }
}
