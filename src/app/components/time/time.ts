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
    disabled = false;
    dateHidden = false;
    format = 24;
    date: string;
    period: string;
    hours: number;
    minutes: string;
    timeout: any;

    constructor(
        private settingService: SettingService,
        private timeDateService: TimeDateService
    ) {}

    ngOnInit() {
        const { disabled, dateHidden, format } = this.settingService.getSetting("time");
        this.disabled = disabled;
        this.format = format;
        this.dateHidden = dateHidden;

        if (!disabled) {
            this.updateTime();

            if (!dateHidden) {
                this.setDate();
            }
        }
        this.settingService.subscribeToSettingChanges(this.changeHandler.bind(this));
    }

    changeHandler({ time }) {
        if (!time) {
            return;
        }
        const { disabled, dateHidden, format } = time;

        if (typeof disabled === "boolean") {
            this.disabled = disabled;

            if (disabled) {
                clearTimeout(this.timeout);
            }
            else {
                this.updateTime();
            }
        }
        else if (typeof dateHidden === "boolean") {
            this.dateHidden = dateHidden;

            if (!dateHidden) {
                this.setDate();
            }
        }
        else if (typeof format === "number") {
            this.format = format;
            clearTimeout(this.timeout);
            this.updateTime();
        }
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

    updateTime() {
        const currentTime = this.getCurrentTime();
        const { hours, minutes, period } = this.timeDateService.getTime(currentTime, this.format);

        this.hours = hours;
        this.minutes = padTime(minutes);
        this.period = period;

        this.timeout = setTimeout(() => {
            this.updateTime();
        }, 1000);
    }
}
