import { Component, Input, Output, EventEmitter, ViewChild } from "@angular/core";
import { PadTimePipe } from "app/pipes/padTimePipe";

@Component({
    selector: "timer",
    template: `
        <div class="upper-block-item" [class.visible]="visible">
            <div class="upper-block-item-content">
                <div (input)="onInput($event)">
                    <ng-container *ngIf="!running || hours">
                        <input type="text" class="upper-block-digit timer-input" data-input="hours"
                            [class.one-digit]="running && hours < 10"
                            [value]="hours | padTime : !running"
                            [readonly]="running" #hoursInput>
                        <span class="upper-block-sep">h</span>
                    </ng-container>
                    <ng-container *ngIf="!running || hours || minutes">
                        <input type="text" class="upper-block-digit timer-input" data-input="minutes"
                            [class.one-digit]="running && !hours && minutes < 10"
                            [value]="minutes | padTime : !running || hours"
                            [readonly]="running" #minutesInput>
                        <span class="upper-block-sep">m</span>
                    </ng-container>
                    <input type="text" class="upper-block-digit timer-input" data-input="seconds"
                        [class.one-digit]="running && !hours && !minutes && seconds < 10"
                        [value]="seconds | padTime : !running || hours || minutes"
                        [readonly]="running">
                    <span class="upper-block-sep">s</span>
                </div>
            </div>
            <div class="upper-block-group upper-block-item-controls">
                <button class="btn-secondary btn-secondary-alt btn-secondary-large"
                    (click)="toggle()">{{ running ? "Stop" : "Start" }}</button>
                <button class="btn-secondary btn-secondary-alt btn-secondary-large upper-block-reset-btn"
                    (click)="reset()">Reset</button>
                <ng-container *ngIf="running">
                    <button class="btn-secondary btn-secondary-alt" (click)="expandSize()" title="Expand">
                        <svg viewBox="0 0 24 24">
                            <use href="#expand"></use>
                        </svg>
                    </button>
                    <button class="btn-secondary btn-secondary-alt" (click)="enterFullscreen()" title="Enter fullscreen">
                        <svg viewBox="0 0 24 24">
                            <use href="#fullscreen"></use>
                        </svg>
                    </button>
                </ng-container>
                <button class="btn-secondary btn-secondary-alt" title="Toggle alarm"
                    (click)="toggleAlarm()">
                    <svg viewBox="0 0 24 24">
                        <use attr.href="#bell{{alarmOn ? '': '-off'}}"></use>
                    </svg>
                </button>
            </div>
        </div>
    `
})
export class Timer {
    @ViewChild("hoursInput") hoursInput;
    @ViewChild("minutesInput") minutesInput;
    @Output() size = new EventEmitter();
    @Output() fullscreen = new EventEmitter();
    @Input() visible: boolean = false;

    running: boolean = false;
    alarmOn: boolean = true;
    timeout: number = 0;
    hours: number = 0;
    minutes: number = 0;
    seconds: number = 0;
    padTime: PadTimePipe = new PadTimePipe();
    alarm: HTMLAudioElement;

    onInput({ target }) {
        const input = target.getAttribute("data-input");
        const pos = target.selectionStart - 1;
        const value = target.value;

        if (/\D/.test(value)) {
            target.value = this.padTime.transform(this[input]);
            target.selectionEnd = pos;
            return;
        }
        else if (!value) {
            this[input] = 0;
            return;
        }

        if (value.length > 2) {
            const hours = this.hoursInput.nativeElement.value;
            const minutes = this.minutesInput.nativeElement.value;

            if (input === "seconds") {
                this.hours = parseInt(hours[1] + minutes[0], 10);
                this.minutes = parseInt(minutes[1] + value[0], 10);
            }
            else if (input === "minutes") {
                this.hours = parseInt(hours[1] + value[0], 10);
            }
            this[input] = parseInt(value.slice(1), 10);
            target.value = this.padTime.transform(this[input]);
            target.selectionEnd = pos;
        }
        else {
            this[input] = parseInt(value, 10);
            target.value = this.padTime.transform(this[input]);
        }
    }

    normalizeValues() {
        if (this.seconds >= 60) {
            this.seconds -= 60;
            this.minutes += 1;
        }

        if (this.minutes >= 60) {
            this.minutes -= 60;
            this.hours += 1;
        }

        if (this.hours > 99) {
            this.hours = 99;
        }
    }

    update(startTime, elapsed) {
        if (!this.running) {
            return;
        }
        elapsed += 1000;
        const diff = performance.now() - startTime - elapsed;

        if (this.seconds || this.minutes || this.hours) {
            if (!this.seconds) {
                if (this.minutes) {
                    this.minutes -= 1;
                    this.seconds += 60;
                }
                else if (this.hours) {
                    this.hours -= 1;
                    this.minutes += 59;
                    this.seconds += 60;
                }
            }
            this.seconds -= 1;

            this.timeout = window.setTimeout(() => {
                this.update(startTime, elapsed);
            }, 1000 - diff);
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

    start() {
        if (this.seconds || this.minutes || this.hours) {
            const startTime = performance.now();

            this.initAlarm();
            this.normalizeValues();
            this.running = true;
            this.timeout = window.setTimeout(() => {
                this.update(startTime, 0);
            }, 1000);
        }
    }

    stop() {
        this.running = false;
        clearTimeout(this.timeout);
    }

    reset() {
        this.hours = 0;
        this.minutes = 0;
        this.seconds = 0;

        if (this.running) {
            this.stop();
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
