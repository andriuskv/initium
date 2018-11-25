import { Component, Input, Output, EventEmitter } from "@angular/core";
import { SettingService } from "../../services/settingService";

@Component({
    selector: "pomodoro",
    template: `
        <div class="upper-block-item" [class.visible]="visible">
            <div class="upper-block-item-content">
                <div class="pomodoro">
                    <ng-container *ngIf="hours">
                        <span class="upper-block-digit">{{ hours }}</span>
                        <span class="upper-block-sep">h</span>
                    </ng-container>
                    <span class="upper-block-digit">{{ hours ? (minutes | padTime) : minutes }}</span>
                    <span class="upper-block-sep">m</span>
                    <span class="upper-block-digit">{{ seconds | padTime }}</span>
                    <span class="upper-block-sep">s</span>
                </div>
                <div class="upper-block-group pomodoro-selection">
                    <button class="btn-secondary btn-secondary-alt pomodoro-btn"
                        [class.active]="mode === 'pomodoro'"
                        (click)="setMode('pomodoro')">Pomodoro</button>
                    <button class="btn-secondary btn-secondary-alt pomodoro-btn"
                        [class.active]="mode === 'short'"
                        (click)="setMode('short')">Short Break</button>
                    <button class="btn-secondary btn-secondary-alt pomodoro-btn"
                        [class.active]="mode === 'long'"
                        (click)="setMode('long')">Long Break</button>
                </div>
            </div>
            <div class="upper-block-group upper-block-item-controls">
                <button class="btn-secondary btn-secondary-alt btn-secondary-large"
                    (click)="toggle()">{{ running ? "Stop" : "Start" }}</button>
                <button class="btn-secondary  btn-secondary-alt btn-secondary-large upper-block-reset-btn"
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
    mode: string = "pomodoro";
    alarm: HTMLAudioElement;

    constructor(private settingService: SettingService) {
        this.settingService = settingService;
    }

    ngOnInit() {
        this.resetTimer();
    }

    update(duration, elapsed) {
        if (!this.running) {
            return;
        }
        const interval = 1000;
        const diff = performance.now() - elapsed;
        elapsed += interval;
        duration -= 1;

        this.hours = Math.floor(duration / 3600);
        this.minutes = Math.floor(duration / 60 % 60);
        this.seconds = duration % 60;

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

        this.hours = Math.floor(minutes / 60);
        this.minutes = minutes % 60;
        this.seconds = 0;

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
