import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from "@angular/core";

@Component({
    selector: "stopwatch",
    template: `
        <div class="stopwatch" (click)="toggle()">
            <ng-container *ngIf="hours">
                <span class="upper-block-digit">{{ hours }}</span>
                <span class="upper-block-sep">h</span>
            </ng-container>
            <ng-container *ngIf="minutes">
                <span class="upper-block-digit">{{ hours ? (minutes | padTime) : minutes }}</span>
                <span class="upper-block-sep">m</span>
            </ng-container>
            <span class="upper-block-digit">{{ minutes ? (seconds | padTime) : seconds }}</span>
            <span class="upper-block-sep">s</span>
            <span class="stopwatch-milliseconds">{{ milliseconds | slice: 2 | padTime }}</span>
        </div>
    `
})
export class Stopwatch {
    @Output() running = new EventEmitter();
    @Output() updateTitle = new EventEmitter();
    @Input() state;

    isRunning: boolean = false;
    isWorkerInitialized: boolean = false;
    hours: number = 0;
    minutes: number = 0;
    seconds: number = 0;
    milliseconds: number = 0;
    worker: Worker;

    constructor(private ref: ChangeDetectorRef) {
        this.ref = ref;
    }

    ngOnChanges() {
        if (this.state) {
            this.isRunning = this.state.isRunning;

            if (this.state.command) {
                this[this.state.command]();
            }
        }
    }

    ngOnViewInit() {
        this.ref.detach();
    }

    initWorker() {
        this.isWorkerInitialized = true;
        this.worker = new Worker("ww.js");
        this.worker.onmessage = ({ data }) => {
            if (this.isRunning) {
                this.update(Date.now() - data);
            }
        };
    }

    update(elapsed) {
        this.milliseconds += elapsed;

        if (this.milliseconds >= 1000) {
            this.milliseconds -= 1000;
            this.seconds += 1;

            if (this.seconds >= 60) {
                this.seconds -= 60;
                this.minutes += 1;
            }

            if (this.minutes >= 60) {
                this.minutes -= 60;
                this.hours += 1;
            }
            this.updateTitle.emit({
                hours: this.hours,
                minutes: this.minutes,
                seconds: this.seconds
            });
        }
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
        if (!this.isWorkerInitialized) {
            this.initWorker();
        }
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
        this.hours = 0;
        this.minutes = 0;
        this.seconds = 0;
        this.milliseconds = 0;

        if (this.isRunning) {
            this.stop();
        }
        this.ref.detectChanges();
    }
}
