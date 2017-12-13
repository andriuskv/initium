import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from "@angular/core";

@Component({
    selector: "stopwatch",
    template: `
        <div class="stopwatch" (click)="toggle()">
            <span *ngIf="stopwatch.hours">
                <span class="upper-block-digit">{{ stopwatch.hours }}</span>
                <span class="upper-block-sep">h</span>
            </span>
            <span *ngIf="stopwatch.minutes">
                <span class="upper-block-digit">{{ stopwatch.minutes }}</span>
                <span class="upper-block-sep">m</span>
            </span>
            <span class="upper-block-digit">{{ stopwatch.seconds }}</span>
            <span class="upper-block-sep">s</span>
            <span class="stopwatch-milliseconds">{{ stopwatch.milliseconds | slice: 2 }}</span>
        </div>
    `
})
export class Stopwatch {
    @Output() running = new EventEmitter();
    @Output() updateTitle = new EventEmitter();
    @Input() state;

    isRunning: boolean = false;
    stopwatch: any = this.resetTime();
    worker: Worker = new Worker("ww.js");

    constructor(private ref: ChangeDetectorRef) {
        this.ref = ref;

        this.initWorker();
    }

    ngOnChanges(changes) {
        if (!changes.state.firstChange) {
            const state = changes.state.currentValue;
            this.isRunning = state.isRunning;
            this[state.command]();
        }
    }

    ngOnViewInit() {
        this.ref.detach();
    }

    initWorker() {
        this.worker.onmessage = event => {
            this.update(Date.now() - event.data);
        };
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
        let hours = this.stopwatch.hours;
        let minutes: any = parseInt(this.stopwatch.minutes, 10);
        let seconds: any = parseInt(this.stopwatch.seconds, 10);
        let milliseconds: any = parseFloat(this.stopwatch.milliseconds) + elapsed;

        if (milliseconds >= 1000) {
            seconds += 1;
            milliseconds -= 1000;

            this.updateTitle.emit({ hours, minutes, seconds });
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
        this.ref.detectChanges();
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
        this.worker.postMessage("start");
        this.isRunning = true;
        this.running.emit(this.isRunning);
    }

    stop() {
        this.worker.postMessage("stop");
        this.isRunning = false;
        this.running.emit(this.isRunning);
    }

    reset() {
        if (this.isRunning) {
            this.stop();
        }
        this.stopwatch = this.resetTime();
        this.ref.detectChanges();
    }
}
