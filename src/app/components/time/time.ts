import { Component } from "@angular/core";
import { SettingService } from "../../services/settingService";
import { TimeDateService } from "../../services/timeDateService";

@Component({
    selector: "time",
    template: `
        <div class="time" *ngIf="!disabled">
            <div class="clock-container">
                <span class="clock">{{ hours }}:{{ minutes | padTime }}</span>
                <span class="period" *ngIf="period">{{ period }}</span>
            </div>
            <div class="date" *ngIf="!dateHidden">{{ date }}</div>
        </div>
    `
})
export class Time {
    disabled: boolean = false;
    dateHidden: boolean = false;
    date: string;
    period: string;
    format: number = 24;
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
        const { disabled, dateHidden, format } = this.settingService.getSetting("time");

        if (!disabled) {
            this.updateTime(format);

            if (!dateHidden) {
                this.setDate();
            }
        }
        this.disabled = disabled;
        this.dateHidden = dateHidden;
        this.format = format;
        this.settingService.subscribeToChanges(this.changeHandler.bind(this));
    }

    changeHandler({ time }) {
        if (!time) {
            return;
        }
        const { disabled, dateHidden, format } = time;

        if (format) {
            clearTimeout(this.timeout);

            if (!this.disabled) {
                this.updateTime(format);
            }
            this.format = format;
        }
        else if (typeof dateHidden === "boolean") {
            if (!dateHidden && !this.date) {
                this.setDate();
            }
            this.dateHidden = dateHidden;
        }
        else if (typeof disabled === "boolean") {
            if (disabled) {
                clearTimeout(this.timeout);
            }
            else {
                this.updateTime(this.format);

                if (!this.dateHidden && !this.date) {
                    this.setDate();
                }
            }
            this.disabled = disabled;
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
