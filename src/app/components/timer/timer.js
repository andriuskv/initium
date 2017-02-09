import { Component, Input, Output, EventEmitter } from "@angular/core";

@Component({
    selector: "timer",
    templateUrl: "app/components/timer/timer.html"
})
export class Timer {
    @Output() hide = new EventEmitter();
    @Input() toggle;

    constructor() {
        this.timer = {
            hours: "00",
            minutes: "00",
            seconds: "00"
        };
        this.visible = false;
        this.isSet = false;
        this.timeout = 0;
        this.alarmOn = true;
        this.alarm = null;
    }

    ngOnChanges(changes) {
        const toggle = changes.toggle;

        if (!toggle.isFirstChange()) {
            this.visible = toggle.currentValue;
        }
    }

    hideTimer() {
        this.hide.emit("timer");
    }

    updateValues(selectionStart, currentKey, target) {
        return (nextInput, targetInput) => {
            if (selectionStart === 0) {
                nextInput.value += currentKey;
            }
            else {
                nextInput.value += targetInput.value[0];
                if (selectionStart === 1) {
                    targetInput.value = currentKey + targetInput.value[1];

                    Promise.resolve().then(() => {
                        target.setSelectionRange(1, 1);
                    });
                }
                else {
                    targetInput.value = targetInput.value[1] + currentKey;
                }
            }
        };
    }

    onKeypress(event, hoursInput, minutesInput, secondsInput) {
        const currentKey = String.fromCharCode(event.which);
        const target = event.target;
        const selectionStart = target.selectionStart;

        if (/\D/.test(currentKey)) {
            event.preventDefault();
            return;
        }

        if (selectionStart === target.selectionEnd && target.value.length === 2) {
            const hours = hoursInput.value;
            const updateInputs = this.updateValues(selectionStart, currentKey, target);

            if (target === secondsInput) {
                const minutes = minutesInput.value;

                if (minutes.length === 2) {
                    minutesInput.value = minutes[1];

                    if (hours.length === 2) {
                        hoursInput.value = hours[1] + minutes[0];
                    }
                    else if (hours.length === 1) {
                        hoursInput.value = hours[0] + minutes[0];
                    }
                    else {
                        hoursInput.value = minutes[0];
                    }
                }
                updateInputs(minutesInput, secondsInput);
            }
            else if (target === minutesInput) {
                if (hours.length === 2) {
                    hoursInput.value = hours[1];
                }
                updateInputs(hoursInput, minutesInput);
            }
            else if (target === hoursInput) {
                if (selectionStart === 0) {
                    event.preventDefault();
                }
                else if (selectionStart === 1) {
                    hoursInput.value = currentKey + hours[1];
                    Promise.resolve().then(() => {
                        target.setSelectionRange(1, 1);
                    });
                }
                else {
                    hoursInput.value = hours[1] + currentKey;
                }
            }
        }
    }

    checkTime(value) {
        return /^\d{2}$/.test(value) ? value : `0${value}`;
    }

    checkInput(value) {
        return !value ? "00" : this.checkTime(value);
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

        return {
            hours: this.checkInput(hours),
            minutes: this.checkInput(minutes),
            seconds: this.checkInput(seconds)
        };
    }

    updateTitle(hours, minutes, seconds) {
        if (hours === 0 && minutes === 0 && seconds !== 0) {
            document.title = `${seconds}s | Initium`;
        }
        else if (hours === 0 && minutes) {
            document.title = `${minutes}m ${seconds}s | Initium`;
        }
        else {
            document.title = `${hours}h ${minutes}m ${seconds}s | Initium`;
        }
    }

    initAlarm() {
        if (!this.alarm) {
            this.alarm = document.createElement("audio");
            this.alarm.setAttribute("src", "./assets/alarm-clock.mp3");
        }
    }

    toggleAlarm() {
        if (this.alarmIsRunning && this.isSet && this.alarmOn) {
            clearTimeout(this.alarmTimeout);
            this.alarmIsRunning = false;
            this.stopTimer();
        }
        this.alarmOn = !this.alarmOn;
    }

    runAlarm() {
        if (this.alarmOn) {
            this.alarmIsRunning = true;
            this.alarm.play();
            this.alarmTimeout = setTimeout(() => {
                this.alarmIsRunning = false;
                this.stopTimer();
            }, 9000);
        }
        else {
            this.stopTimer();
        }
    }

    updateTimer(startTime, elapsed) {
        if (!this.isSet) {
            return;
        }

        const ideal = performance.now() - startTime;
        let diff = 0;

        elapsed += 1000;
        diff = ideal - elapsed;

        let hours = Number.parseInt(this.timer.hours, 10);
        let minutes = Number.parseInt(this.timer.minutes, 10);
        let seconds = Number.parseInt(this.timer.seconds, 10);

        if (this.isSet && (seconds || minutes || hours)) {
            if (minutes && seconds === 0) {
                minutes -= 1;
                seconds += 60;
            }
            else if (hours && minutes === 0 && seconds === 0) {
                hours -= 1;
                minutes += 59;
                seconds += 60;
            }
            seconds -= 1;

            this.timer.hours = this.checkTime(hours);
            this.timer.minutes = this.checkTime(minutes);
            this.timer.seconds = this.checkTime(seconds);

            this.updateTitle(hours, minutes, seconds);

            this.timeout = setTimeout(() => {
                this.updateTimer(startTime, elapsed);
            }, 1000 - diff);
        }
        else {
            this.runAlarm();
        }
    }

    startTimer(hours, minutes, seconds) {
        hours = Number.parseInt(hours, 10) || 0;
        minutes = Number.parseInt(minutes, 10) || 0;
        seconds = Number.parseInt(seconds, 10) || 0;

        if (hours !== 0 || minutes !== 0 || seconds !== 0) {
            this.isSet = true;
            this.initAlarm();
            this.timer = this.initTimer(hours, minutes, seconds);

            const start = performance.now();

            setTimeout(() => {
                this.updateTimer(start, 0);
            }, 1000);
        }
    }

    assignValueToInput(input, value) {
        if (input) {
            input.value = value;
        }
    }

    stopTimer(hoursInput, minutesInput, secondsInput) {
        this.assignValueToInput(hoursInput, this.timer.hours);
        this.assignValueToInput(minutesInput, this.timer.minutes);
        this.assignValueToInput(secondsInput, this.timer.seconds);
        this.isSet = false;
        clearTimeout(this.timeout);
        document.title = "Initium";

        if (this.alarmOn) {
            this.alarm.pause();
        }
    }

    resetTimer(hoursInput, minutesInput, secondsInput) {
        if (this.isSet) {
            this.timer.hours = "00";
            this.timer.minutes = "00";
            this.timer.seconds = "00";
            this.stopTimer();
            return;
        }
        hoursInput.value = "00";
        minutesInput.value = "00";
        secondsInput.value = "00";
    }
}
