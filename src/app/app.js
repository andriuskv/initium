import { Component } from "@angular/core";

@Component({
    selector: "app",
    template: `
        <background [setting]="settings.background"></background>
        <time [setting]="settings.time"></time>
        <main-block [setting]="settings.mainBlock"></main-block>
        <calendar-reminders
           [setting]="settings.time"
           [newReminders]="reminders">
        </calendar-reminders>
        <weather [setting]="settings.weather"></weather>
        <todo></todo>
        <widget-menu
            (toggle)="onToggle($event)"
            (setting)="onSetting($event)"
            (reminders)="onReminders($event)">
        </widget-menu>
        <timer [toggle]="toggle.timer"></timer>
    `
})
export class App {
    toggle = {};
    settings = {};

    onToggle(whatToToggle) {
        this.toggle[whatToToggle] = !this.toggle[whatToToggle] || false;
    }

    onSetting(settings) {
        this.settings = Object.assign({}, settings);
    }

    onReminders(reminders) {
        this.reminders = reminders;
    }
}
