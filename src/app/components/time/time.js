import { Component, Input } from "@angular/core";
import { DateService } from "./../../services/dateService";

@Component({
    selector: "time",
    template: `
        <div class="time" *ngIf="clock">
            <div class="clock-container">
                <div class="clock">{{ clock }}</div>
                <div class="marker" *ngIf="marker">{{ marker }}</div>
            </div>
            <div class="date"
                [class.has-marker]="marker"
                *ngIf="!dateDisabled">{{ date }}</div>
        </div>
    `
})
export class Time {
    @Input() setting;

    static get parameters() {
        return [[DateService]];
    }

    constructor(dateService) {
        this.dateService = dateService;
        this.dateDisabled = false;
        this.timeout = 0;
    }

    ngOnChanges(changes) {
        const setting = changes.setting.currentValue;

        if (setting) {
            if (setting.timeDisplay) {
                this.changeTimeDisplay(setting.timeDisplay);
            }
            if (!setting.dateDisabled) {
                this.date = this.dateService.getDate();
            }
            this.dateDisabled = setting.dateDisabled;
        }
    }

    beautifyTime(time) {
        return time > 9 ? time : `0${time}`;
    }

    changeTimeDisplay(display) {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        if (display === "0") {
            this.clock = this.get12HourTime();
            this.updateTime(this.get12HourTime);
        }
        else {
            this.marker = "";
            this.clock = this.get24HourTime();
            this.updateTime(this.get24HourTime);
        }
    }

    get12HourTime() {
        const date = new Date();
        const minutes = this.beautifyTime(date.getMinutes());
        let hours = date.getHours();

        if (hours >= 12) {
            this.marker = "PM";
            hours = hours !== 12 ? hours - 12 : hours;
        }
        else {
            this.marker = "AM";
        }
        hours = this.beautifyTime(hours);

        return `${hours}:${minutes}`;
    }

    get24HourTime() {
        const date = new Date();
        const hours = this.beautifyTime(date.getHours());
        const minutes = this.beautifyTime(date.getMinutes());

        return `${hours}:${minutes}`;
    }

    updateTime(cb) {
        this.timeout = setTimeout(() => {
            this.clock = cb.call(this);
            this.updateTime(cb);
        }, 1000);
    }
}
