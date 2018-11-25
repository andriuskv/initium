import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from "@angular/core";

@Component({
    selector: "stopwatch",
    template: `
        <div class="upper-block-item" [class.visible]="visible">
            <div class="upper-block-item-content">
                <div class="stopwatch">
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
            </div>
        </div>
    `
})
export class Stopwatch {
    @Output() size = new EventEmitter();
    @Output() fullscreen = new EventEmitter();
    @Input() visible: boolean = false;

    running: boolean = false;
    hours: number = 0;
    minutes: number = 0;
    seconds: number = 0;
    milliseconds: number = 0;
    animationId: number;

    constructor(private ref: ChangeDetectorRef) {}

    ngOnViewInit() {
        this.ref.detach();
    }

    update(elapsed) {
        const diff = performance.now() - elapsed;
        this.milliseconds += diff;

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
        }
        this.ref.detectChanges();
        this.animationId = requestAnimationFrame(() => {
            this.update(elapsed + diff);
        });
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
        this.animationId = requestAnimationFrame(() => {
            this.update(performance.now());
        });
        this.running = true;
    }

    stop() {
        cancelAnimationFrame(this.animationId);
        this.running = false;
    }

    reset() {
        this.hours = 0;
        this.minutes = 0;
        this.seconds = 0;
        this.milliseconds = 0;

        if (this.running) {
            this.stop();
        }
        this.ref.detectChanges();
    }

    expandSize() {
        this.size.emit(true);
    }

    enterFullscreen() {
        this.fullscreen.emit(true);
    }
}
