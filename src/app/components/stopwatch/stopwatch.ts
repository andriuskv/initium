import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from "@angular/core";
import { padTime } from "../../utils/utils.js";

@Component({
    selector: "stopwatch",
    templateUrl: "./stopwatch.html"
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
    minutesDisplay: string = "0";
    secondsDisplay: string = "0";
    millisecondsDisplay: string = "00";

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
            this.minutesDisplay = padTime(this.minutes, this.hours);
            this.secondsDisplay = padTime(this.seconds, this.minutes);
        }
        this.millisecondsDisplay = padTime(Math.floor(this.milliseconds).toString().slice(0, 2));
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
        this.secondsDisplay = "0";
        this.millisecondsDisplay = "00";

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
