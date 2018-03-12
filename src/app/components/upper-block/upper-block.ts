import { Component, Input, Output, EventEmitter, Inject } from "@angular/core";
import { DOCUMENT } from "@angular/platform-browser";
import { ZIndexService } from "../../services/zIndexService";

@Component({
    selector: "upper-block",
    templateUrl: "./upper-block.html"
})
export class UpperBlock {
    @Output() hide = new EventEmitter();
    @Input() visible;

    isInFullscreen: boolean = false;
    isExpanded: boolean = false;
    active: string = "timer";
    fullscreenBtnTitle: string = "Fullscreen";
    expandBtnTitle: string = "Expand";
    zIndex: number = 0;
    activeComponents: Array<string> = [];
    alarm: HTMLAudioElement;
    state: any;

    constructor(
        @Inject(DOCUMENT) private document,
        private zIndexService: ZIndexService
    ) {
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
            this.fullscreenBtnTitle = `${this.isInFullscreen ? "Exit" : ""} Fullscreen`;
        });
    }

    ngOnChanges(changes) {
        if (this.visible) {
            this.zIndex = this.zIndexService.inc();
        }
    }

    hideComp() {
        this.isExpanded = false;

        if (this.document.webkitIsFullScreen) {
            this.document.webkitExitFullscreen();
        }
        else {
            this.hide.emit("upper");
        }
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
        }
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

    toggleSize() {
        this.isExpanded = !this.isExpanded;
        this.expandBtnTitle = this.isExpanded ? "Contract" : "Expand";
    }

    handleClickOnContainer() {
        this.zIndex = this.zIndexService.incIfLess(this.zIndex);
    }
}
