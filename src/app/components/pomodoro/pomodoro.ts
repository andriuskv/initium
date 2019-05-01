import { Component, Input, Output, EventEmitter } from "@angular/core";
import { SettingService } from "../../services/settingService";
import { padTime } from "../../utils/utils.js";

@Component({
    selector: "pomodoro",
    templateUrl: "./pomodoro.html"
})
export class Pomodoro {
    @Output() size = new EventEmitter();
    @Output() fullscreen = new EventEmitter();
    @Input() visible: boolean = false;

    running: boolean = false;
    alarmOn: boolean = true;
    timeout: number = 0;
    hours: number = 0;
    minutes: number = 0;
    seconds: number = 0;
    minutesDisplay: string = "0";
    secondsDisplay: string = "0";
    mode: string = "pomodoro";
    alarm: HTMLAudioElement;

    constructor(private settingService: SettingService) {}

    ngOnInit() {
        this.resetTimer();
    }

    update(duration, elapsed) {
        const interval = 1000;
        const diff = performance.now() - elapsed;
        elapsed += interval;
        duration -= 1;

        this.updateTimer(duration);

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
        const duration = this.calculateDuration();

        this.initAlarm();
        this.running = true;
        this.timeout = window.setTimeout(() => {
            this.update(duration, performance.now());
        }, 1000);
    }

    updateTimer(duration) {
        this.hours = Math.floor(duration / 3600);
        this.minutes = Math.floor(duration / 60 % 60);
        this.seconds = duration % 60;
        this.minutesDisplay = padTime(this.minutes, this.hours);
        this.secondsDisplay = padTime(this.seconds, this.hours || this.minutes);
    }

    stop() {
        this.running = false;
        clearTimeout(this.timeout);
    }

    reset() {
        this.resetTimer();
        this.stop();
        this.size.emit(false);
        this.fullscreen.emit(false);
    }

    setMode(mode) {
        if (mode === this.mode) {
            return;
        }

        if (this.running) {
            this.stop();
        }
        this.mode = mode;
        this.resetTimer();
    }

    getMinutes(mode, { short, long, duration }) {
        if (mode === "short") {
            return short;
        }
        else if (mode === "long") {
            return long;
        }
        return duration;
    }

    resetTimer() {
        const settings = this.settingService.getSetting("pomodoro");
        const minutes = this.getMinutes(this.mode, settings);

        this.updateTimer(minutes * 60);

        if (this.hours > 99) {
            this.hours = 99;
        }
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
