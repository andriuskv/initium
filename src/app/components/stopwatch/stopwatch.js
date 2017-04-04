import { Component, Input, Output, EventEmitter } from "@angular/core";

@Component({
    selector: "stopwatch",
    template: `
        <div class="stopwatch" (click)="toggle()">
            <span *ngIf="stopwatch.hours">
                <span class="stopwatch-digit">{{ stopwatch.hours }}</span>
                <span class="timer-stopwatch-sep">h</span>
            </span>
            <span *ngIf="stopwatch.minutes">
                <span class="stopwatch-digit">{{ stopwatch.minutes }}</span>
                <span class="timer-stopwatch-sep">m</span>
            </span>
            <span class="stopwatch-digit">{{ stopwatch.seconds }}</span>
            <span class="timer-stopwatch-sep">s</span>
            <span class="stopwatch-milliseconds">{{ stopwatch.milliseconds }}</span>
        </div>
    `
})
export class Stopwatch {
    @Output() running = new EventEmitter();
    @Input() state;

    constructor() {
        this.isRunning = false;
        this.stopwatch = this.resetTime();
    }

    ngOnChanges(changes) {
        if (!changes.state.firstChange) {
            const state = changes.state.currentValue;
            this.isRunning = state.isRunning;
            this[state.command]();
        }
    }

    resetTime() {
        return {
            hours: 0,
            minutes: 0,
            seconds: 0,
            milliseconds: "00"
        };
    }

    update(elapsed) {
        if (!this.isRunning) {
            return;
        }
        const start = performance.now();
        let hours = this.stopwatch.hours;
        let minutes = parseInt(this.stopwatch.minutes, 10);
        let seconds = parseInt(this.stopwatch.seconds, 10);
        let milliseconds = parseInt(this.stopwatch.milliseconds, 10) + elapsed;

        if (milliseconds >= 1000) {
            seconds += 1;
            milliseconds -= 1000;
        }

        if (seconds >= 60) {
            seconds -= 60;
            minutes += 1;
        }

        if (minutes >= 60) {
            minutes -= 60;
            hours += 1;
        }

        if (hours && minutes < 10) {
            minutes = `0${minutes}`;
        }

        if (minutes && seconds < 10) {
            seconds = `0${seconds}`;
        }

        if (milliseconds < 100) {
            milliseconds = `0${milliseconds}`;
        }

        this.stopwatch.hours = hours;
        this.stopwatch.minutes = minutes;
        this.stopwatch.seconds = seconds;
        this.stopwatch.milliseconds = milliseconds;

        requestAnimationFrame(() => {
            const diff = Math.floor(performance.now() - start);

            this.update(diff);
        });
    }

    toggle() {
        if (this.isRunning) {
            this.stop();
        }
        else {
            this.start();
        }
    }

    start() {
        this.isRunning = true;
        this.running.emit(this.isRunning);
        this.update(0);
    }

    stop() {
        this.isRunning = false;
        this.running.emit(this.isRunning);
    }

    reset() {
        this.stop();
        this.stopwatch = this.resetTime();
    }
}
