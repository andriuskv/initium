import { Component } from "@angular/core";
import { SettingService } from "../../services/settingService";
import { TimeDateService } from "../../services/timeDateService";

@Component({
    selector: "time",
    template: `
        <div class="time">
            <div>
                <span class="clock">{{ hours }}:{{ minutes | padTime }}</span>
                <span class="period" *ngIf="period">{{ period }}</span>
            </div>
            <div class="date" *ngIf="!dateDisabled">{{ date }}</div>
        </div>
    `
})
export class Time {
    dateDisabled: boolean = false;
    date: string;
    period: string;
    hours: number;
    minutes: number;
    timeout: any;

    constructor(
        private settingService: SettingService,
        private timeDateService: TimeDateService
    ) {
        this.timeDateService = timeDateService;
        this.settingService = settingService;
    }

    ngOnInit() {
        const { timeDisplay, dateDisabled } = this.settingService.getSetting("time");

        this.changeTimeDisplay(timeDisplay);
        this.initDate(dateDisabled);
        this.settingService.subscribeToChanges(this.changeHandler.bind(this));
    }

    changeHandler({ time }) {
        if (!time) {
            return;
        }

        if (time.timeDisplay) {
            this.changeTimeDisplay(time.timeDisplay);
        }
        else if (typeof time.dateDisabled === "boolean") {
            this.initDate(time.dateDisabled);
        }
    }

    initDate(isDisabled) {
        if (!isDisabled) {
            this.date = this.timeDateService.getDate();
        }
        this.dateDisabled = isDisabled;
    }

    changeTimeDisplay(display) {
        clearTimeout(this.timeout);

        if (display === "0") {
            this.updateTime(this.get12HourTime);
        }
        else {
            this.period = "";
            this.updateTime(this.get24HourTime);
        }
    }

    getCurrentTime() {
        const date = new Date();

        return {
            hours: date.getHours(),
            minutes: date.getMinutes()
        };
    }

    get12HourTime() {
        let { hours, minutes } = this.getCurrentTime();
        this.period = hours < 12 ? "AM" : "PM";

        if (!hours) {
            hours = 12;
        }
        else {
            hours = hours > 12 ? hours - 12 : hours;
        }
        return { hours, minutes };
    }

    get24HourTime() {
        return this.getCurrentTime();
    }

    updateTime(cb) {
        const { hours, minutes } = cb.call(this);

        this.hours = hours;
        this.minutes = minutes;
        this.timeout = setTimeout(() => {
            this.updateTime(cb);
        }, 1000);
    }
}
