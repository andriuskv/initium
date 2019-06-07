import { Component, Input, Output, EventEmitter, ViewChild } from "@angular/core";
import { padTime } from "../../utils/utils.js";

@Component({
    selector: "timer",
    templateUrl: require("raw-loader!./timer.html").default
})
export class Timer {
    @ViewChild("hoursInput", { static : false }) hoursInput;
    @ViewChild("minutesInput", { static : false }) minutesInput;
    @Output() size = new EventEmitter();
    @Output() fullscreen = new EventEmitter();
    @Input() visible: boolean = false;

    running: boolean = false;
    alarmOn: boolean = true;
    timeout: number = 0;
    hours: number = 0;
    minutes: number = 0;
    seconds: number = 0;
    hoursDisplay: string = "00";
    minutesDisplay: string = "00";
    secondsDisplay: string = "00";
    alarm: HTMLAudioElement;

    onInput({ target }) {
        const input = target.getAttribute("data-input");
        const pos = target.selectionStart - 1;
        const value = target.value;

        if (/\D/.test(value)) {
            target.value = this[input];
            target.selectionEnd = pos;
            return;
        }
        else if (!value) {
            this[input] = "00";
            target.value = "00";
            return;
        }

        if (value.length > 2) {
            const hours = this.hoursInput.nativeElement.value;
            const minutes = this.minutesInput.nativeElement.value;
            const paddedValue = padTime(value.slice(1));

            if (input === "secondsDisplay") {
                this.hoursDisplay = hours[1] + minutes[0];
                this.minutesDisplay = minutes[1] + value[0];
            }
            else if (input === "minutesDisplay") {
                this.hoursDisplay = hours[1] + value[0];
            }
            this[input] = paddedValue;
            target.value = paddedValue;
            target.selectionEnd = pos;
        }
        else {
            const paddedValue = padTime(value);
            this[input] = paddedValue;
            target.value = paddedValue;
        }
    }

    normalizeValues() {
        let hours = parseInt(this.hoursDisplay, 10);
        let minutes = parseInt(this.minutesDisplay, 10);
        let seconds = parseInt(this.secondsDisplay, 10);

        if (seconds >= 60) {
            seconds -= 60;
            minutes += 1;
        }

        if (minutes >= 60) {
            minutes -= 60;
            hours += 1;
        }

        if (hours > 99) {
            hours = 99;
        }
        this.hours = hours;
        this.minutes = minutes;
        this.seconds = seconds;
    }

    update(duration, elapsed) {
        const interval = 1000;
        const diff = performance.now() - elapsed;
        elapsed += interval;
        duration -= 1;

        this.hours = Math.floor(duration / 3600);
        this.minutes = Math.floor(duration / 60 % 60);
        this.seconds = duration % 60;
        this.hoursDisplay = this.hours.toString();
        this.minutesDisplay = padTime(this.minutes, this.hours);
        this.secondsDisplay = padTime(this.seconds, this.hours || this.minutes);

        if (duration) {
            this.timeout = window.setTimeout(() => {
                this.update(duration, elapsed);
            }, interval - diff);
        }
        else if (this.alarmOn) {
            this.runAlarm();
        }
        else {
            this.reset();
        }
    }

    toggle() {
        if (this.running) {
            this.stop();
        }
        else {
            this.start();
        }
    }

    calculateDuration() {
        return this.seconds + (this.minutes * 60) + (this.hours * 3600);
    }

    start() {
        this.normalizeValues();

        if (this.seconds || this.minutes || this.hours) {
            const duration = this.calculateDuration();
            this.minutesDisplay = padTime(this.minutes, this.hours);
            this.secondsDisplay = padTime(this.seconds, this.hours || this.minutes);

            this.initAlarm();
            this.running = true;
            this.timeout = window.setTimeout(() => {
                this.update(duration, performance.now());
            }, 1000);
        }
    }

    stop() {
        this.hoursDisplay = padTime(this.hours);
        this.minutesDisplay = padTime(this.minutes);
        this.secondsDisplay = padTime(this.seconds);
        this.running = false;
        clearTimeout(this.timeout);
    }

    reset() {
        this.hoursDisplay = "00";
        this.minutesDisplay = "00";
        this.secondsDisplay = "00";

        if (this.running) {
            this.running = false;
            clearTimeout(this.timeout);
        }
        this.size.emit(false);
        this.fullscreen.emit(false);
    }

    toggleAlarm() {
        this.alarmOn = !this.alarmOn;
    }

    initAlarm() {
        if (this.alarm) {
            return;
        }
        this.alarm = new Audio("./assets/alarm.mp3");
        this.alarm.volume = 0.4;
    }

    runAlarm() {
        this.alarm.play();

        setTimeout(() => {
            this.reset();
        }, 3000);
    }

    expandSize() {
        this.size.emit(true);
    }

    enterFullscreen() {
        this.fullscreen.emit(true);
    }
}
