import { Component } from "@angular/core";

@Component({
    selector: "app",
    template: `
        <background [setting]="settings.background"></background>
        <time [setting]="settings.time"></time>
        <calendar-reminders
            [setting]="settings.time"
            [newReminders]="reminders">
        </calendar-reminders>
        <main-block [setting]="settings.mainBlock"></main-block>
        <weather [setting]="settings.weather"></weather>
        <todo></todo>
        <widget-menu
            (toggle)="onToggle($event)"
            (setting)="onSetting($event)"
            (reminders)="onReminders($event)">
        </widget-menu>
        <timer
            [toggleComp]="toggle.timer"
            (hide)="onHide($event)">
        </timer>
        <stopwatch
            [toggleComp]="toggle.stopwatch"
            (hide)="onHide($event)">
        </stopwatch>
    `
})
export class App {
    constructor() {
        this.toggle = {};
        this.settings = {};
    }

    onToggle(whatToToggle) {
        this.toggle[whatToToggle] = !this.toggle[whatToToggle] || false;

        if (this.toggle[whatToToggle]) {
            if (whatToToggle === "timer") {
                this.toggle.stopwatch = false;
            }
            else if (whatToToggle === "stopwatch") {
                this.toggle.timer = false;
            }
        }
    }

    onSetting(settings) {
        this.settings = Object.assign({}, settings);
    }

    onReminders(reminders) {
        this.reminders = reminders;
    }

    onHide(component) {
        this.toggle[component] = false;
    }
}
