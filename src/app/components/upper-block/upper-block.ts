import { Component, Input, Output, EventEmitter, Inject } from "@angular/core";
import { DOCUMENT } from "@angular/platform-browser";

@Component({
    selector: "upper-block",
    template: `
        <div class="container upper-block" [class.visible]="visible">
            <ul class="upper-block-header">
                <li class="upper-block-header-item" [class.active]="active === 'timer'">
                    <button class="btn-icon" (click)="toggleTab('timer')">
                        <svg viewBox="0 0 24 24">
                            <path d="M6,2H18V8H18V8L14,12L18,16V16H18V22H6V16H6V16L10,12L6,8V8H6V2M16,16.5L12,12.5L8,16.5V20H16V16.5M12,11.5L16,7.5V4H8V7.5L12,11.5M10,6H14V6.75L12,8.75L10,6.75V6Z" />
                        </svg>
                        <span>TIMER</span>
                    </button>
                </li>
                <li class="upper-block-header-item" [class.active]="active === 'stopwatch'">
                    <button class="btn-icon" (click)="toggleTab('stopwatch')">
                        <svg viewBox="0 0 24 24">
                            <path d="M12,20A7,7 0 0,1 5,13A7,7 0 0,1 12,6A7,7 0 0,1 19,13A7,7 0 0,1 12,20M19.03,7.39L20.45,5.97C20,5.46 19.55,5 19.04,4.56L17.62,6C16.07,4.74 14.12,4 12,4A9,9 0 0,0 3,13A9,9 0 0,0 12,22C17,22 21,17.97 21,13C21,10.88 20.26,8.93 19.03,7.39M11,14H13V8H11M15,1H9V3H15V1Z" />
                        </svg>
                        <span>STOPWATCH</span>
                    </button>
                </li>
                <li class="upper-block-hide-btn">
                    <button class="btn-icon" (click)="hideComp()" title="Close">
                        <svg viewBox="0 0 24 24">
                            <use href="#cross"></use>
                        </svg>
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
                        <button class="btn-transparent timer-stopwatch-control" (click)="setCommand('start')" *ngIf="!state[active].isRunning">Start</button>
                        <button class="btn-transparent timer-stopwatch-control" (click)="setCommand('stop')" *ngIf="state[active].isRunning">Stop</button>
                        <button class="btn-transparent timer-stopwatch-control timer-stopwatch-reset-btn" (click)="setCommand('reset')">Reset</button>
                        <button class="btn-icon timer-stopwatch-control" title="Toggle alarm" (click)="setCommand('toggleAlarm')" *ngIf="active === 'timer'">
                            <svg viewBox="0 0 24 24">
                                <use attr.href="#bell{{state.timer.alarmOn ? '': '-off'}}"></use>
                            </svg>
                        </button>
                        <button class="btn-icon timer-stopwatch-control" [title]="fullscreenBtnTitle" (click)="toggleFullscreen(fullscreenTarget)">
                            <svg viewBox="0 0 24 24">
                                <use attr.href="#fullscreen{{isInFullscreen ? '-exit': ''}}"></use>
                            </svg>
                        </button>
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

        if (!isRunning) {
            document.title = "New Tab | Initium";
        }
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
