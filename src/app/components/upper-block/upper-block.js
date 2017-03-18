import { Component, Input, Output, EventEmitter } from "@angular/core";

@Component({
    selector: "upper-block",
    template: `
        <div class="container upper-block" [class.visible]="visible">
            <ul class="upper-block-header">
                <li class="upper-block-header-item" [class.active]="active === 'timer'">
                    <button class="font-btn" (click)="toggleTab('timer')">
                        <span class="icon-hourglass"></span>
                        <span>TIMER</span>
                    </button>
                </li>
                <li class="upper-block-header-item" [class.active]="active === 'stopwatch'">
                    <button class="font-btn" (click)="toggleTab('stopwatch')">
                        <span class="icon-stopwatch"></span>
                        <span>STOPWATCH</span>
                    </button>
                </li>
                <li class="upper-block-header-item">
                    <button class="font-btn" (click)="hideComp()">
                        <span class="icon-cancel"></span>
                    </button>
                </li>
            </ul>
            <div class="upper-block-item" [class.visible]="active === 'timer'">
                <timer [state]="state.timer" (running)="onRunning($event, 'timer')"></timer>
            </div>
            <div class="upper-block-item" [class.visible]="active === 'stopwatch'">
                <stopwatch [state]="state.stopwatch" (running)="onRunning($event, 'stopwatch')"></stopwatch>
            </div>
            <div class="timer-stopwatch-controls">
                <button class="font-btn timer-stopwatch-control"
                    (click)="setCommand('start')"
                    *ngIf="!state[active].isRunning"
                >Start</button>
                <button class="font-btn timer-stopwatch-control"
                    (click)="setCommand('stop')"
                    *ngIf="state[active].isRunning"
                >Stop</button>
                <button class="font-btn timer-stopwatch-control" (click)="setCommand('reset')">Reset</button>
                <button class="font-btn timer-stopwatch-control timer-alarm-btn"
                    [ngClass]="{
                        'icon-bell-alt': state.timer.alarmOn,
                        'icon-bell-off': !state.timer.alarmOn
                    }"
                    (click)="setCommand('toggleAlarm')"
                    *ngIf="active === 'timer'"
                ></button>
            </div>
        </div>
    `
})
export class UpperBlock {
    @Output() hide = new EventEmitter();
    @Input() toggleComp;

    constructor() {
        this.active = "timer";
        this.state = {
            timer: {
                isRunning: false,
                alarmOn: true
            },
            stopwatch: {
                isRunning: false
            }
        };
    }

    ngOnChanges(changes) {
        const toggle = changes.toggleComp;

        if (!toggle.firstChange) {
            this.visible = toggle.currentValue;
        }
    }

    hideComp() {
        this.hide.emit("upper");
    }

    toggleTab(tab) {
        this.active = tab;
    }

    setCommand(command) {
        const state = this.state[this.active];
        state.command = command;

        if (command === "toggleAlarm") {
            state.alarmOn = !state.alarmOn;
        }
        this.state[this.active] = Object.assign({}, state);
    }

    onRunning(isRunning, component) {
        this.state[component].isRunning = isRunning;
    }
}
