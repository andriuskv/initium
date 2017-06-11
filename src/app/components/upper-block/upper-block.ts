import { Component, Input, Output, EventEmitter, Inject } from "@angular/core";
import { DOCUMENT } from "@angular/platform-browser";

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
            <div class="upper-block-content-wrapper" #fullscreenTarget>
                <div class="upper-block-content">
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
                        <button class="font-btn timer-stopwatch-control timer-stopwatch-reset-btn"
                            (click)="setCommand('reset')"
                        >Reset</button>
                        <button class="font-btn timer-stopwatch-control"
                            title="Toggle alarm"
                            [ngClass]="{
                                'icon-bell-alt': state.timer.alarmOn,
                                'icon-bell-off': !state.timer.alarmOn
                            }"
                            (click)="setCommand('toggleAlarm')"
                            *ngIf="active === 'timer'"
                        ></button>
                        <button class="font-btn timer-stopwatch-control"
                            [title]="fullscreenBtnTitle"
                            [ngClass]="{
                                'icon-resize-small': isInFullscreen,
                                'icon-resize-full': !isInFullscreen
                            }"
                            (click)="toggleFullscreen(fullscreenTarget)"
                        ></button>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class UpperBlock {
    @Output() hide = new EventEmitter();
    @Input() toggleComp;

    active: string = "timer";
    isInFullscreen: boolean = false;
    visible: boolean = false;
    state: any;
    fullscreenBtnTitle: string = "Enter fullscreen";

    constructor(@Inject(DOCUMENT) private document) {
        this.document = document;
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

    ngOnInit() {
        this.document.addEventListener("webkitfullscreenchange", () => {
            this.isInFullscreen = this.document.webkitIsFullScreen;
            this.fullscreenBtnTitle = `${this.isInFullscreen ? "Leave": "Enter"} fullscreen`;
        }) ;
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

    toggleFullscreen(target) {
        if (this.document.webkitIsFullScreen) {
            this.document.webkitExitFullscreen();
        }
        else {
            target.webkitRequestFullScreen();
        }
    }
}
