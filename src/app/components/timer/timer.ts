import { Component, Input, Output, EventEmitter } from "@angular/core";
import { PadTimePipe } from "app/pipes/padTimePipe";

@Component({
    selector: "timer",
    template: `
        <div (input)="onInput($event, hoursInput.value, minutesInput.value)">
            <input type="text" class="timer-input" data-input="hours"
                [value]="hours | padTime" [readonly]="isRunning" #hoursInput>
            <span class="upper-block-sep">h</span>
            <input type="text" class="timer-input" data-input="minutes"
                [value]="minutes | padTime" [readonly]="isRunning" #minutesInput>
            <span class="upper-block-sep">m</span>
            <input type="text" class="timer-input" data-input="seconds"
                [value]="seconds | padTime" [readonly]="isRunning">
            <span class="upper-block-sep">s</span>
        </div>
    `
})
export class Timer {
    @Output() running = new EventEmitter();
    @Output() updateTitle = new EventEmitter();
    @Output() alarm = new EventEmitter();
    @Input() state;

    isRunning: boolean = false;
    alarmOn: boolean = true;
    timeout: number = 0;
    hours: number = 0;
    minutes: number = 0;
    seconds: number = 0;
    padTime: PadTimePipe = new PadTimePipe();

    ngOnChanges() {
        if (this.state) {
            this.isRunning = this.state.isRunning;
            this.alarmOn = this.state.alarmOn;

            if (this.state.command) {
                this[this.state.command]();
            }
        }
    }

    onInput({ target }, hours, minutes) {
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

    normalizeTimer() {
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

    updateTimer(startTime, elapsed) {
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
                this.updateTimer(startTime, elapsed);
            }, 1000 - diff);

            this.updateTitle.emit({
                hours: this.hours,
                minutes: this.minutes,
                seconds: this.seconds
            });
        }
        else if (this.alarmOn) {
            this.alarm.emit("timer");
        }
        else {
            this.reset();
        }
    }

    start() {
        if (this.seconds || this.minutes || this.hours) {
            const startTime = performance.now();

            this.normalizeTimer();
            this.isRunning = true;
            this.running.emit(this.isRunning);
            this.timeout = window.setTimeout(() => {
                this.updateTimer(startTime, 0);
            }, 1000);
        }
    }

    stop() {
        this.isRunning = false;
        this.running.emit(this.isRunning);
        clearTimeout(this.timeout);
    }

    reset() {
        this.hours = 0;
        this.minutes = 0;
        this.seconds = 0;

        if (this.isRunning) {
            this.stop();
        }
    }
}
