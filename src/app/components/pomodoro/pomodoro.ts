import { Component, Input, Output, EventEmitter } from "@angular/core";
import { SettingService } from "../../services/settingService";
import { padTime } from "../../utils/utils.js";

@Component({
    selector: "pomodoro",
    templateUrl: "./pomodoro.html",
    styleUrls: ["./pomodoro.scss"]
})
export class Pomodoro {
    @Output() size = new EventEmitter();
    @Output() fullscreen = new EventEmitter();
    @Input() visible = false;

    settings = this.settingService.getSetting("pomodoro");
    running = false;
    paused = false;
    alarmOn = true;
    settingsVisible = false;
    timeout = 0;
    hours = 0;
    minutes = 0;
    seconds = 0;
    minutesDisplay = "0";
    secondsDisplay = "0";
    mode = "pomodoro";
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
            this.stop(true);
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
        this.paused = false;
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

    stop(paused) {
        this.running = false;
        this.paused = paused;
        clearTimeout(this.timeout);
    }

    reset() {
        this.resetTimer();
        this.stop(false);
        this.size.emit(false);
        this.fullscreen.emit(false);
    }

    setMode(mode) {
        if (mode === this.mode) {
            return;
        }

        if (this.running) {
            this.stop(false);
        }
        this.mode = mode;
        this.resetTimer();
    }

    getMinutes(mode) {
        const { short, long, duration } = this.settings;

        if (mode === "short") {
            return short;
        }
        else if (mode === "long") {
            return long;
        }
        return duration;
    }

    resetTimer() {
        const minutes = this.getMinutes(this.mode);

        this.updateTimer(minutes * 60);

        if (this.hours > 99) {
            this.hours = 99;
        }
    }

    toggleSettings() {
        this.settingsVisible = !this.settingsVisible;
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

    setPomodoroDuration({ target }, settingName) {
        let value = parseInt(target.value, 10);

        if (!value || value <= 0) {
            value = 1;
            target.value = value;
        }
        this.settings[settingName] = value;
        this.settingService.updateSetting({ pomodoro: this.settings });

        if (!this.running && !this.paused) {
            this.resetTimer();
        }
    }
}
