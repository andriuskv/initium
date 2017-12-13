import { Component, Input, Output, EventEmitter, Inject } from "@angular/core";
import { DOCUMENT } from "@angular/platform-browser";
import { ZIndexService } from "../../services/zIndexService";

@Component({
    selector: "upper-block",
    template: `
        <div class="container upper-block"
            [class.visible]="visible"
            [style.zIndex]="zIndex"
            (click)="handleClickOnContainer()">
            <ul class="upper-block-header">
                <li class="upper-block-header-item" [class.active]="active === 'timer'">
                    <button class="btn-icon" (click)="toggleTab('timer')">
                        <svg viewBox="0 0 24 24">
                            <path d="M6,2H18V8H18V8L14,12L18,16V16H18V22H6V16H6V16L10,12L6,8V8H6V2M16,16.5L12,12.5L8,16.5V20H16V16.5M12,11.5L16,7.5V4H8V7.5L12,11.5M10,6H14V6.75L12,8.75L10,6.75V6Z" />
                        </svg>
                        <span>Timer</span>
                    </button>
                </li>
                <li class="upper-block-header-item" [class.active]="active === 'stopwatch'">
                    <button class="btn-icon" (click)="toggleTab('stopwatch')">
                        <svg viewBox="0 0 24 24">
                            <path d="M12,20A7,7 0 0,1 5,13A7,7 0 0,1 12,6A7,7 0 0,1 19,13A7,7 0 0,1 12,20M19.03,7.39L20.45,5.97C20,5.46 19.55,5 19.04,4.56L17.62,6C16.07,4.74 14.12,4 12,4A9,9 0 0,0 3,13A9,9 0 0,0 12,22C17,22 21,17.97 21,13C21,10.88 20.26,8.93 19.03,7.39M11,14H13V8H11M15,1H9V3H15V1Z" />
                        </svg>
                        <span>Stopwatch</span>
                    </button>
                </li>
                <li class="upper-block-header-item" [class.active]="active === 'pomodoro'">
                    <button class="btn-icon" (click)="toggleTab('pomodoro')">
                        <svg viewBox="0 0 24 24">
                            <path d="M11,17A1,1 0 0,0 12,18A1,1 0 0,0 13,17A1,1 0 0,0 12,16A1,1 0 0,0 11,17M11,3V7H13V5.08C16.39,5.57 19,8.47 19,12A7,7 0 0,1 12,19A7,7 0 0,1 5,12C5,10.32 5.59,8.78 6.58,7.58L12,13L13.41,11.59L6.61,4.79V4.81C4.42,6.45 3,9.05 3,12A9,9 0 0,0 12,21A9,9 0 0,0 21,12A9,9 0 0,0 12,3M18,12A1,1 0 0,0 17,11A1,1 0 0,0 16,12A1,1 0 0,0 17,13A1,1 0 0,0 18,12M6,12A1,1 0 0,0 7,13A1,1 0 0,0 8,12A1,1 0 0,0 7,11A1,1 0 0,0 6,12Z" />
                        </svg>
                        <span>Pomodoro</span>
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
                        <timer [state]="state.timer"
                            (running)="onRunning($event, 'timer')"
                            (updateTitle)="updateTitle($event, 'timer')"
                            (alarm)="runAlarm($event)"></timer>
                    </div>
                    <div class="upper-block-item" [class.visible]="active === 'stopwatch'">
                        <stopwatch [state]="state.stopwatch"
                            (running)="onRunning($event, 'stopwatch')"
                            (updateTitle)="updateTitle($event, 'stopwatch')"></stopwatch>
                    </div>
                    <div class="upper-block-item" [class.visible]="active === 'pomodoro'">
                        <pomodoro [state]="state.pomodoro"
                            (running)="onRunning($event, 'pomodoro')"
                            (updateTitle)="updateTitle($event, 'pomodoro')"
                            (alarm)="runAlarm($event)"></pomodoro>
                    </div>
                    <div class="upper-block-controls">
                        <button class="btn-transparent upper-block-control"
                            *ngIf="!state[active].isRunning"
                            (click)="setCommand('start')">Start</button>
                        <button class="btn-transparent upper-block-control"
                            *ngIf="state[active].isRunning"
                            (click)="setCommand('stop')">Stop</button>
                        <button class="btn-transparent upper-block-control upper-block-reset-btn"
                            (click)="setCommand('reset')">Reset</button>
                        <button class="btn-icon upper-block-control" title="Toggle alarm"
                            *ngIf="active !== 'stopwatch'"
                            (click)="toggleAlarm()">
                            <svg viewBox="0 0 24 24">
                                <use attr.href="#bell{{state[active].alarmOn ? '': '-off'}}"></use>
                            </svg>
                        </button>
                        <button class="btn-icon upper-block-control" [title]="fullscreenBtnTitle" (click)="toggleFullscreen(fullscreenTarget)">
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
    @Input() visible;

    isInFullscreen: boolean = false;
    active: string = "timer";
    fullscreenBtnTitle: string = "Enter fullscreen";
    zIndex: number = 0;
    activeComponents: Array<string> = [];
    alarm: HTMLAudioElement;
    state: any;

    constructor( @Inject(DOCUMENT) private document, private zIndexService: ZIndexService) {
        this.document = document;
        this.zIndexService = zIndexService;
        this.state = {
            timer: {
                isRunning: false,
                alarmOn: true
            },
            stopwatch: {
                isRunning: false
            },
            pomodoro: {
                isRunning: false,
                alarmOn: true
            }
        };
    }

    ngOnInit() {
        this.document.addEventListener("webkitfullscreenchange", () => {
            this.isInFullscreen = this.document.webkitIsFullScreen;
            this.fullscreenBtnTitle = `${this.isInFullscreen ? "Leave": "Enter"} fullscreen`;
        });
    }

    ngOnChanges(changes) {
        if (this.visible) {
            this.zIndex = this.zIndexService.inc();
        }
    }

    hideComp() {
        this.hide.emit("upper");
    }

    toggleTab(tab) {
        this.active = tab;
    }

    setCommand(command, component = this.active) {
        this.state[component] = Object.assign({}, this.state[component], { command });
    }

    onRunning(isRunning, component) {
        this.state[component].isRunning = isRunning;

        if (!isRunning) {
            document.title = "New Tab | Initium";
            this.activeComponents = this.activeComponents.filter(comp => comp !== component);
        }
        else {
            this.activeComponents.push(component);

            if (!this.alarm && component !== "stopwatch") {
                this.alarm = new Audio("./assets/alarm.mp3");
                this.alarm.volume = 0.5;
            }
        };
    }

    updateTitle(data, component) {
        const lastActiveComp = this.activeComponents[this.activeComponents.length - 1];

        if (component === lastActiveComp) {
            const { hours, minutes, seconds } = data;
            let title = `${seconds}s | Initium`;

            if (minutes) {
                title = `${minutes}m ${title}`;
            }
            if (hours) {
                title = `${hours}h ${title}`;
            }
            document.title = title;
        }
    }

    toggleAlarm() {
        const state = this.state[this.active];
        this.state[this.active] = Object.assign({}, state, {
            alarmOn: !state.alarmOn,
            command: ""
         });
    }

    runAlarm(component) {
        this.alarm.play();

        setTimeout(() => {
            this.setCommand("reset", component);
        }, 3000);
    }

    toggleFullscreen(target) {
        if (this.document.webkitIsFullScreen) {
            this.document.webkitExitFullscreen();
        }
        else {
            target.webkitRequestFullScreen();
        }
    }

    handleClickOnContainer() {
        this.zIndex = this.zIndexService.incIfLess(this.zIndex);
    }
}
