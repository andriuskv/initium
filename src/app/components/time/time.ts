import { Component, Input } from "@angular/core";
import { DateService } from "../../services/dateService";

@Component({
    selector: "time",
    template: `
        <div class="time" *ngIf="clock">
            <div class="clock-container">
                <div class="clock">{{ clock }}</div>
                <div class="period" *ngIf="period">{{ period }}</div>
            </div>
            <div class="date" *ngIf="!dateDisabled">{{ date }}</div>
        </div>
    `
})
export class Time {
    @Input() setting;

    dateDisabled: boolean = false;
    date: string;
    period: string;
    clock: string;
    timeout: any;

    constructor(private dateService: DateService) {
        this.dateService = dateService;
    }

    ngOnChanges(changes) {
        const setting = changes.setting.currentValue;

        if (setting) {
            if (setting.timeDisplay) {
                this.changeTimeDisplay(setting.timeDisplay);
            }
            if (typeof setting.dateDisabled === "boolean") {
                if (!setting.dateDisabled) {
                    this.date = this.dateService.getDate();
                }
                this.dateDisabled = setting.dateDisabled;
            }
        }
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
        const minutes = date.getMinutes();

        return {
            hours: date.getHours(),
            minutes: minutes > 9 ? minutes : `0${minutes}`
        };
    }

    get12HourTime() {
        const time = this.getCurrentTime();
        let hours = time.hours;

        this.period = hours < 12 ? "AM" : "PM";

        if (!hours) {
            hours = 12;
        }
        else {
            hours = hours > 12 ? hours - 12 : hours;
        }
        return `${hours}:${time.minutes}`;
    }

    get24HourTime() {
        const { hours, minutes } = this.getCurrentTime();

        return `${hours}:${minutes}`;
    }

    updateTime(cb) {
        this.clock = cb.call(this);

        this.timeout = setTimeout(() => {
            this.updateTime(cb);
        }, 1000);
    }
}
