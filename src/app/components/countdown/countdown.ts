import { Component, Input, ViewChild, Output, EventEmitter } from "@angular/core";
import { padTime } from "../../utils/utils.js";
import { TimeDateService } from "../../services/timeDateService";
import { SettingService } from "../../services/settingService";
import { ChromeStorageService } from "../../services/chromeStorageService";

@Component({
    selector: "countdown",
    templateUrl: "./countdown.html",
    styleUrls: ["./countdown.scss"]
})
export class Countdown {
    @Input() visible = false;
    @ViewChild("formElement") formElement;
    @Output() status = new EventEmitter();

    timeout = 0;
    countdowns = [];
    formVisible = false;
    formMessage = "";
    formValues: any = {};
    activeField: any = {};
    boundFocusHandler = this.handleFormFocus.bind(this);
    boundClickHandler = this.selectValue.bind(this);

    constructor(
        private timeDateService: TimeDateService,
        private settingService: SettingService,
        private chromeStorageService: ChromeStorageService
    ) {}

    ngOnInit() {
        this.chromeStorageService.subscribeToChanges(({ countdowns }) => {
            if (countdowns) {
                this.startCountdowns(countdowns.newValue);
            }
        });
        this.chromeStorageService.get("countdowns", ({ countdowns }) => {
            if (countdowns?.length) {
                this.startCountdowns(countdowns);
            }
        });
    }

    startCountdowns(countdowns) {
        this.countdowns = countdowns.map(countdown => {
            const date = new Date(countdown.dateString);
            return {
                title: countdown.title,
                date: this.getCountdownDateString(date),
                dateString: countdown.dateString
            };
        });
        this.start();
    }

    showForm() {
        this.formVisible = true;

        setTimeout(() => {
            this.formElement.nativeElement.addEventListener("focus", this.boundFocusHandler, true);
            window.addEventListener("click", this.boundClickHandler);
        });
    }

    hideForm() {
        this.formVisible = false;
        this.formValues = {};
        this.formElement.nativeElement.removeEventListener("focus", this.boundFocusHandler, true);
        window.removeEventListener("click", this.boundClickHandler);
    }

    getTimeString(date) {
        const hours = date.getHours();
        const minutes = date.getMinutes();

        if (hours === 0 && minutes === 0) {
            return "";
        }
        const { format } = this.settingService.getSetting("time");
        return this.timeDateService.getTimeString({ hours, minutes }, format);
    }

    getCountdownDateString(date) {
        const dateString = this.timeDateService.getDate("month day, year", {
            day: date.getDate(),
            month: date.getMonth(),
            year: date.getFullYear(),
            dayWithSuffix: false
        });
        const timeString = this.getTimeString(date);

        return `${dateString} ${timeString}`;
    }

    getHours(value) {
        const format24 = /^(([0-1]?[0-9])|(2[0-3]))$/;
        const format12 = /^((0*?[1-9])|(1[0-2])) *?[a|p|A|P][m|M]$/;
        value = value.trim();

        if (!value) {
            return 0;
        }
        else if (!format24.test(value) && !format12.test(value)) {
            return "invalid";
        }
        const hours = parseInt(value, 10);
        const suffix = value.slice(-2).toLowerCase();

        if (suffix === "am" && hours === 12) {
            return 0;
        }
        else if (suffix === "pm" && hours !== 12) {
            return hours + 12;
        }
        return hours;
    }

    createCountdown(event) {
        const { title, years, months, days, hours, minutes } = event.target.elements;
        const hoursValue = this.getHours(hours.value);

        event.preventDefault();

        if (hoursValue === "invalid") {
            this.formMessage = "Invalid date.";
            return;
        }
        const dateString = `${years.value}-${padTime(months.value)}-${padTime(days.value)}T${padTime(hoursValue)}:${padTime(minutes.value)}:00`;
        const date = new Date(dateString);

        if (date.toString() === "Invalid Date") {
            this.formMessage = "Invalid date.";
            return;
        }
        const currentDate = new Date();

        if (date.getTime() - currentDate.getTime() < 1000) {
            this.formMessage = "Can't countdown to the past.";
            return;
        }
        this.countdowns.unshift({
            title: title.value.trim(),
            date: this.getCountdownDateString(date),
            dateString
        });
        this.start();
        this.hideForm();
        this.saveCountdowns();
    }

    handleFormKeydown(event) {
        if (event.key === "Enter" && event.target.nodeName === "INPUT") {
            event.preventDefault();
        }
    }

    handleFormFocus({ target }) {
        const { name } = target;
        this.activeField = {
            name,
            dataList: [],
            dataListPositionX: target.offsetLeft + target.offsetWidth / 2,
            dataListPositionY: target.offsetTop + target.offsetHeight
        };

        if (this.formMessage) {
            this.formMessage = "";
        }

        if (name === "years") {
            const date = new Date();
            const currentYear = date.getFullYear();
            let year = currentYear;

            while (year <= currentYear + 10) {
                this.activeField.dataList.push({
                    value: year,
                    displayValue: year
                });
                year += 1;
            }
        }
        else if (name === "months") {
            let month = 0;

            while (month < 12) {
                this.activeField.dataList.push({
                    value: month + 1,
                    displayValue: `${padTime(month + 1)} - ${this.timeDateService.getMonth(month, true)}`
                });
                month += 1;
            }
        }
        else if (name === "days") {
            let day = 1;

            while (day < 32) {
                this.activeField.dataList.push({
                    value: day,
                    displayValue: day
                });
                day += 1;
            }
        }
        else if (name === "hours") {
            let hour = 0;

            while (hour < 24) {
                this.activeField.dataList.push({
                    value: hour,
                    displayValue: `${padTime(hour)} - ${this.timeDateService.getTimeString({ hours: hour, minutes: 0 }, 12)}`
                });
                hour += 1;
            }
        }
        else if (name === "minutes") {
            let minute = 0;

            while (minute < 60) {
                this.activeField.dataList.push({
                    value: minute,
                    displayValue: minute
                });
                minute += 5;
            }
        }
    }

    selectValue({ target }) {
        if (!this.formElement || !this.formElement.nativeElement.contains(target)) {
            this.activeField = {};
            return;
        }
        const { name } = this.activeField;

        if (target.nodeName === "INPUT" || target.nodeName === "UL" || !name) {
            return;
        }
        const value = target.getAttribute("data-item");

        if (value) {
            this.formValues[name] = parseInt(value, 10);
        }
        this.activeField = {};
    }

    update(elapsed) {
        const interval = 1000;
        const diff = performance.now() - elapsed;
        const countdownsEnded = this.updateCountdowns();

        if (countdownsEnded) {
            clearTimeout(this.timeout);
        }
        else {
            this.timeout = window.setTimeout(() => {
                this.update(elapsed + interval);
            }, interval - diff);
        }
    }

    updateCountdowns() {
        const startDate = new Date() as any;
        let countdownsEnded = true;

        for (const countdown of this.countdowns) {
            const endDate = new Date(countdown.dateString) as any;
            let diff = Math.floor((endDate - startDate) / 1000);

            if (diff < 1) {
                countdown.ended = true;
                countdown.seconds = 0;

                if (!countdown.statusEmited) {
                    this.emitStatus();
                    countdown.statusEmited = true;
                }
            }
            else {
                const years = Math.floor(diff / 31540000);
                diff %= 31540000;
                const months = Math.floor(diff / 2628000);
                diff %= 2628000;
                const days = Math.floor(diff / 86400);
                diff %= 86400;
                const hours = Math.floor(diff / 3600);
                diff %= 3600;
                const minutes = Math.floor(diff / 60);
                diff %= 60;
                const seconds = diff;

                countdown.years = years > 99 ? 99 : years;
                countdown.months = months;
                countdown.days = days;
                countdown.hours = hours;
                countdown.minutes = minutes;
                countdown.seconds = seconds;
                countdownsEnded = false;
            }
        }
        return countdownsEnded;
    }

    start() {
        this.updateCountdowns();
        clearTimeout(this.timeout);
        this.timeout = window.setTimeout(() => {
            this.update(performance.now());
        }, 1000);
        setTimeout(() => {
            this.emitStatus();
        }, 1000);
    }

    removeCountdown(index) {
        this.countdowns.splice(index, 1);

        if (!this.countdowns.length) {
            clearTimeout(this.timeout);
        }
        this.emitStatus();
        this.saveCountdowns();
    }

    emitStatus() {
        this.status.emit({
            running: this.countdowns.length > 0,
            hasEnded: this.countdowns.some(countdown => countdown.ended)
        });
    }

    saveCountdowns() {
        const countdowns = this.countdowns.map(countdown => ({
            title: countdown.title,
            dateString: countdown.dateString
        }));
        this.chromeStorageService.set({ countdowns });
    }
}
