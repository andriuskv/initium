import { Component } from "@angular/core";
import { SettingService } from "../../services/settingService";
import { TimeDateService } from "../../services/timeDateService";

@Component({
    selector: "time",
    template: `
        <div class="time">
            <div class="clock-container">
                <span class="clock">{{ hours }}:{{ minutes | padTime }}</span>
                <span class="period" *ngIf="period">{{ period }}</span>
            </div>
            <div class="date" *ngIf="!dateHidden">{{ date }}</div>
        </div>
    `
})
export class Time {
    dateHidden: boolean = false;
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
        const { dateHidden, format } = this.settingService.getSetting("time");

        this.updateTime(format);
        this.initDate(dateHidden);
        this.settingService.subscribeToChanges(this.changeHandler.bind(this));
    }

    changeHandler({ time }) {
        if (!time) {
            return;
        }
        const { dateHidden, format } = time;

        if (format) {
            clearTimeout(this.timeout);
            this.updateTime(format);
        }
        else if (typeof dateHidden === "boolean") {
            this.initDate(dateHidden);
        }
    }

    initDate(hidden) {
        if (!hidden) {
            this.date = this.timeDateService.getDate("weekday, month day");
        }
        this.dateHidden = hidden;
    }

    getCurrentTime() {
        const date = new Date();

        return {
            hours: date.getHours(),
            minutes: date.getMinutes()
        };
    }

    updateTime(format) {
        const currentTime = this.getCurrentTime();
        const { hours, minutes, period } = this.timeDateService.getTime(currentTime, format);

        this.hours = hours;
        this.minutes = minutes;
        this.period = period;

        this.timeout = setTimeout(() => {
            this.updateTime(format);
        }, 1000);
    }
}
