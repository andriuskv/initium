import { Component, Input, Output, EventEmitter, ViewChild } from "@angular/core";
import { getRandomString, padTime } from "../../utils/utils.js";
import { ChromeStorageService } from "../../services/chromeStorageService";

@Component({
    selector: "timer",
    templateUrl: "./timer.html",
    styleUrls: ["./timer.scss"]
})
export class Timer {
    @ViewChild("hoursInput") hoursInput;
    @ViewChild("minutesInput") minutesInput;
    @Output() size = new EventEmitter();
    @Output() fullscreen = new EventEmitter();
    @Input() visible = false;

    running = false;
    alarmOn = true;
    presetsVisible = false;
    formMessageVisible = false;
    timeout = 0;
    hours = 0;
    minutes = 0;
    seconds = 0;
    hoursDisplay = "00";
    minutesDisplay = "00";
    secondsDisplay = "00";
    presets = [];
    selectedPreset = null;
    formPreset = null;
    alarm: HTMLAudioElement;

    constructor(private chromeStorageService: ChromeStorageService) {}

    ngOnInit() {
        this.chromeStorageService.subscribeToChanges(({ timer }) => {
            if (timer) {
                this.presets = timer.newValue;
            }
        });
        this.chromeStorageService.get("timer", ({ timer = [] }) => {
            this.presets = timer;
        });
    }

    selectPreset(id) {
        const preset = this.presets.find(preset => preset.id === id);
        this.selectedPreset = preset;
        this.hoursDisplay = preset.hours;
        this.minutesDisplay = preset.minutes;
        this.secondsDisplay = preset.seconds;
    }

    showPresets() {
        this.presetsVisible = true;
    }

    hidePresets() {
        this.presetsVisible = false;
    }

    showPresetForm() {
        this.formPreset = { name: "" };
        this.resetTimerValues();
    }

    hidePresetForm() {
        this.formPreset = null;

        if (this.selectedPreset) {
            this.hoursDisplay = this.selectedPreset.hours;
            this.minutesDisplay = this.selectedPreset.minutes;
            this.secondsDisplay = this.selectedPreset.seconds;
        }
        else {
            this.resetTimerValues();
        }
    }

    resetSelectedPreset() {
        this.selectedPreset = null;
        this.resetTimerValues();
    }

    createPreset(event) {
        const value = event.target.elements.name.value.trim();

        event.preventDefault();

        if (this.hoursDisplay === "00" && this.minutesDisplay === "00" && this.secondsDisplay === "00") {
            this.formMessageVisible = true;

            window.setTimeout(() => {
                this.formMessageVisible = false;
            }, 6000);
            return;
        }

        if (this.formPreset.makingEdit) {
            const preset = this.presets[this.formPreset.index];
            preset.name = value;
            preset.hours = this.hoursDisplay;
            preset.minutes = this.minutesDisplay;
            preset.seconds = this.secondsDisplay;
        }
        else {
            this.presets.unshift({
                name: value,
                id: getRandomString(4),
                hours: this.hoursDisplay,
                minutes: this.minutesDisplay,
                seconds: this.secondsDisplay
            });
        }
        this.hidePresetForm();
        this.savePresets();
    }

    editPreset(index) {
        const preset = this.presets[index];

        this.formPreset = {
            ...preset,
            index,
            makingEdit: true
        };
        this.hoursDisplay = padTime(preset.hours);
        this.minutesDisplay = padTime(preset.minutes);
        this.secondsDisplay = padTime(preset.seconds);
    }

    removePreset(index) {
        this.presets.splice(index, 1);
        this.savePresets();
    }

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

    resetTimerValues() {
        this.hoursDisplay = "00";
        this.minutesDisplay = "00";
        this.secondsDisplay = "00";
    }

    reset() {
        if (this.selectedPreset) {
            this.hoursDisplay = this.selectedPreset.hours;
            this.minutesDisplay = this.selectedPreset.minutes;
            this.secondsDisplay = this.selectedPreset.seconds;
        }
        else {
            this.resetTimerValues();
        }

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

    savePresets() {
        this.chromeStorageService.set({ timer: this.presets });
    }
}
