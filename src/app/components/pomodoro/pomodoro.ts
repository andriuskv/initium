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
        const startTime = performance.now();

        this.initAlarm();
        this.running = true;
        this.timeout = window.setTimeout(() => {
            this.update(startTime, 0);
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
