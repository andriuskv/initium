import { Component, Input, Output, EventEmitter } from "@angular/core";

@Component({
    selector: "timer",
    template: `
        <div class="timer" (input)="onInput($event)">
            <input type="text" class="timer-input" data-input="hours"
                [(ngModel)]="timer.hours" [readonly]="isRunning">
            <div class="timer-stopwatch-sep">h</div>
            <input type="text" class="timer-input" data-input="minutes"
                [(ngModel)]="timer.minutes" [readonly]="isRunning">
            <div class="timer-stopwatch-sep">m</div>
            <input type="text" class="timer-input" data-input="seconds"
                [(ngModel)]="timer.seconds" [readonly]="isRunning">
            <div class="timer-stopwatch-sep">s</div>
        </div>
    `
})
export class Timer {
    @Output() running = new EventEmitter();
    @Input() state;

    constructor() {
        this.timer = {
            hours: "00",
            minutes: "00",
            seconds: "00"
        };
        this.timerInput = Object.assign({}, this.timer);
        this.isRunning = false;
        this.timeout = 0;
        this.alarmOn = true;
        this.alarm = null;
    }

    ngOnChanges(changes) {
        if (!changes.state.firstChange) {
            const state = changes.state.currentValue;
            this.isRunning = state.isRunning;
            this.alarmOn = state.alarmOn;
            this[state.command]();
        }
    }

    onInput({ target }) {
        const input = target.getAttribute("data-input");
        const pos = target.selectionStart - 1;
        let value = target.value;

        if (/\D/.test(value)) {
            target.value = this.timerInput[input];
            target.selectionEnd = pos;
            return;
        }

        if (value.length > 2) {
            if (input === "seconds") {
                this.timer.hours = `${this.timer.hours + this.timer.minutes[0]}`.slice(-2);
                this.timerInput.hours = this.timer.hours;
                this.timer.minutes = `${this.timer.minutes + value[0]}`.slice(-2);
                this.timerInput.minutes = this.timer.minutes;
            }
            else if (input === "minutes") {
                this.timer.hours = `${this.timer.hours + value[0]}`.slice(-2);
                this.timerInput.hours = this.timer.hours;
            }
            value = value.slice(1, 3);
            target.value = value;
            this.timerInput[input] = value;
            target.selectionEnd = pos;
        }
        else {
            this.timer = this.padTimer(this.timer);
            this.timerInput[input] = this.timer[input];
        }
    }

    padTime(time) {
        return `00${time}`.slice(-2);
    }

    padTimer(timer) {
        return {
            hours: this.padTime(timer.hours),
            minutes: this.padTime(timer.minutes),
            seconds: this.padTime(timer.seconds)
        };
    }

    parseTimer(timer) {
        return {
            hours: Number.parseInt(timer.hours, 10) || 0,
            minutes: Number.parseInt(timer.minutes, 10) || 0,
            seconds: Number.parseInt(timer.seconds, 10) || 0
        };
    }

    initTimer(hours, minutes, seconds) {
        if (seconds >= 60) {
            seconds -= 60;
            minutes += 1;
        }

        if (minutes >= 60) {
            minutes -= 60;
            hours += 1;
        }

        if (hours >= 99) {
            hours = 99;
        }

        return this.padTimer({ hours, minutes, seconds });
    }

    updateTitle(hours, minutes, seconds) {
        let title = `${seconds}s | Initium`;

        if (minutes) {
            title = `${minutes}m ${title}`;
        }
        if (hours) {
            title = `${hours}h ${title}`;
        }
        document.title = title;
    }

    initAlarm() {
        if (!this.alarm) {
            this.alarm = document.createElement("audio");
            this.alarm.setAttribute("src", "./assets/alarm-clock.mp3");
        }
    }

    toggleAlarm() {
        if (this.alarmIsRunning && this.isRunning && this.alarmOn) {
            clearTimeout(this.alarmTimeout);
            this.alarmIsRunning = false;
            this.stop();
        }
    }

    runAlarm() {
        if (this.alarmOn) {
            this.alarmIsRunning = true;
            this.alarm.play();
            this.alarmTimeout = setTimeout(() => {
                this.alarmIsRunning = false;
                this.stop();
            }, 9000);
        }
        else {
            this.stop();
        }
    }

    updateTimer(startTime, elapsed) {
        if (!this.isRunning) {
            return;
        }

        const ideal = performance.now() - startTime;
        let diff = 0;

        elapsed += 1000;
        diff = ideal - elapsed;

        let { hours, minutes, seconds } = this.parseTimer(this.timer);

        if (this.isRunning && (seconds || minutes || hours)) {
            if (!seconds) {
                if (minutes) {
                    minutes -= 1;
                    seconds += 60;
                }
                else if (hours) {
                    hours -= 1;
                    minutes += 59;
                    seconds += 60;
                }
            }
            seconds -= 1;

            this.timer = this.padTimer({ hours, minutes, seconds });
            this.timerInput = Object.assign({}, this.timer);
            this.updateTitle(hours, minutes, seconds);

            this.timeout = setTimeout(() => {
                this.updateTimer(startTime, elapsed);
            }, 1000 - diff);
        }
        else {
            this.runAlarm();
        }
    }

    start() {
        const { hours, minutes, seconds } = this.parseTimer(this.timerInput);

        if (hours || minutes || seconds) {
            this.isRunning = true;
            this.running.emit(this.isRunning);
            this.initAlarm();
            this.timer = this.initTimer(hours, minutes, seconds);

            const startTime = performance.now();

            setTimeout(() => {
                this.updateTimer(startTime, 0);
            }, 1000);
        }
    }

    stop() {
        this.isRunning = false;
        this.running.emit(this.isRunning);
        clearTimeout(this.timeout);
        document.title = "Initium";

        if (this.alarmOn) {
            this.alarm.pause();
        }
    }

    reset() {
        this.timer = {
            hours: "00",
            minutes: "00",
            seconds: "00"
        };
        this.timerInput = Object.assign({}, this.timer);

        if (this.isRunning) {
            this.stop();
        }
    }
}
