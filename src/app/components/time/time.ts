import { Component } from "@angular/core";
import { SettingService } from "../../services/settingService";
import { TimeDateService } from "../../services/timeDateService";
import { padTime } from "../../utils/utils.js";

@Component({
    selector: "time",
    template: `
        <div class="time" *ngIf="!disabled">
            <div class="clock-container">
                <span class="clock">{{ hours }}:{{ minutes }}</span>
                <span class="period" *ngIf="period">{{ period }}</span>
            </div>
            <div class="date" *ngIf="!dateHidden">{{ date }}</div>
        </div>
    `,
    styleUrls: ["./time.scss"]
})
export class Time {
    disabled: boolean = false;
    dateHidden: boolean = false;
    date: string;
    period: string;
    format: number = 24;
    hours: number;
    minutes: string;
    timeout: any;

    constructor(
        private settingService: SettingService,
        private timeDateService: TimeDateService
    ) {}

    ngOnInit() {
        this.init(this.settingService.getSetting("time"));
        this.settingService.subscribeToSettingChanges(this.changeHandler.bind(this));
    }

    init({ disabled, dateHidden, format}) {
        if (!disabled) {
            this.updateTime(format);

            if (!dateHidden) {
                this.setDate();
            }
        }
        this.disabled = disabled;
        this.format = format;
        this.dateHidden = dateHidden;
    }

    changeHandler({ time }) {
        if (!time) {
            return;
        }
        clearTimeout(this.timeout);
        this.init(time);
    }

    setDate() {
        this.date = this.timeDateService.getDate("weekday, month day");
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
        this.minutes = padTime(minutes);
        this.period = period;

        this.timeout = setTimeout(() => {
            this.updateTime(format);
        }, 1000);
    }
}
