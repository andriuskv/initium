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

        this.updateTime(parseInt(timeDisplay, 10));
        this.initDate(dateDisabled);
        this.settingService.subscribeToChanges(this.changeHandler.bind(this));
    }

    changeHandler({ time }) {
        if (!time) {
            return;
        }

        if (time.timeDisplay) {
            clearTimeout(this.timeout);
            this.updateTime(parseInt(time.timeDisplay, 10));
        }
        else if (typeof time.dateDisabled === "boolean") {
            this.initDate(time.dateDisabled);
        }
    }

    initDate(isDisabled) {
        if (!isDisabled) {
            this.date = this.timeDateService.getDate("weekday, month day");
        }
        this.dateDisabled = isDisabled;
    }

    getCurrentTime() {
        const date = new Date();

        return {
            hours: date.getHours(),
            minutes: date.getMinutes()
        };
    }

    updateTime(timeDisplay) {
        const currentTime = this.getCurrentTime();
        const { hours, minutes, period } = this.timeDateService.getTime(currentTime, timeDisplay);

        this.hours = hours;
        this.minutes = minutes;
        this.period = period;

        this.timeout = setTimeout(() => {
            this.updateTime(timeDisplay);
        }, 1000);
    }
}
