import { Component, Input, Output, EventEmitter } from "@angular/core";
import { SettingService } from "../../services/settingService";

@Component({
    selector: "pomodoro",
    template: `
        <div class="pomodoro">
            <div class="pomodoro-timer">
                <span *ngIf="hours">
                    <span class="upper-block-digit">{{ hours }}</span>
                    <span class="upper-block-sep">h</span>
                </span>
                <span class="upper-block-digit">{{ hours ? (minutes | padTime) : minutes }}</span>
                <span class="upper-block-sep">m</span>
                <span class="upper-block-digit">{{ seconds | padTime }}</span>
                <span class="upper-block-sep">s</span>
            </div>
            <div class="pomodoro-timer-selection">
                <button class="btn-icon pomodoro-timer-btn"
                    [class.active]="mode === 'pomodoro'"
                    (click)="setMode('pomodoro')">Pomodoro</button>
                <button class="btn-icon pomodoro-timer-btn"
                    [class.active]="mode === 'short'"
                    (click)="setMode('short')">Short Break</button>
                <button class="btn-icon pomodoro-timer-btn"
                    [class.active]="mode === 'long'"
                    (click)="setMode('long')">Long Break</button>
            </div>
        </div>
    `
})
export class Pomodoro {
    @Output() running = new EventEmitter();
    @Output() updateTitle = new EventEmitter();
    @Output() alarm = new EventEmitter();
    @Input() state;
    @Input() setting;

    isRunning: boolean = false;
    alarmOn: boolean = true;
    timeout: number = 0;
    hours: number = 0;
    minutes: number = 0;
    seconds: number = 0;
    mode: string = "pomodoro";

    constructor(private settingService: SettingService) {
        this.settingService = settingService;
    }

    ngOnInit() {
        this.resetTimer(this.mode);
    }

    ngOnChanges() {
        if (this.state) {
            this.isRunning = this.state.isRunning;
            this.alarmOn = this.state.alarmOn;

            if (this.state.command) {
                this[this.state.command]();
            }
        }
    }

    update(startTime, elapsed) {
        if (!this.isRunning) {
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

            this.updateTitle.emit({
                hours: this.hours,
                minutes: this.minutes,
                seconds: this.seconds
            });
        }
        else if (this.alarmOn) {
            this.alarm.emit("pomodoro");
        }
        else {
            this.reset();
        }
    }

    start() {
        const startTime = performance.now();

        this.isRunning = true;
        this.running.emit(this.isRunning);
        this.timeout = window.setTimeout(() => {
            this.update(startTime, 0);
        }, 1000);
    }

    stop() {
        this.isRunning = false;
        this.running.emit(this.isRunning);
        clearTimeout(this.timeout);
    }

    reset() {
        this.resetTimer(this.mode);
        this.stop();
    }

    setMode(mode) {
        if (mode === this.mode) {
            return;
        }

        if (this.isRunning) {
            this.stop();
        }
        this.mode = mode;
        this.resetTimer(mode);
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

    resetTimer(mode) {
        const settings = this.settingService.getSetting("pomodoro");
        const minutes = this.getMinutes(mode, settings);

        this.hours = Math.floor(minutes / 60);
        this.minutes = minutes % 60;
        this.seconds = 0;

        if (this.hours > 99) {
            this.hours = 99;
        }
    }
}
