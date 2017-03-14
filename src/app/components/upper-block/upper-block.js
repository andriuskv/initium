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
                <timer></timer>
            </div>
            <div class="upper-block-item" [class.visible]="active === 'stopwatch'">
                <stopwatch></stopwatch>
            </div>
        </div>
    `
})
export class UpperBlock {
    @Output() hide = new EventEmitter();
    @Input() toggleComp;

    constructor() {
        this.active = "timer";
    }

    ngOnChanges(changes) {
        const toggle = changes.toggleComp;

        if (!toggle.isFirstChange()) {
            this.visible = toggle.currentValue;
        }
    }

    hideComp() {
        this.hide.emit("upper");
    }

    toggleTab(tab) {
        this.active = tab;
    }
}
