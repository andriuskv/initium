import { Component, enableProdMode } from "@angular/core";
import { bootstrap } from "@angular/platform-browser-dynamic";
import { Background } from "components/background/background";
import { Time } from "components/time/time";
import { CalendarReminders } from "components/calendar-reminders/calendar-reminders";
import { MainBlock } from "components/main-block/main-block";
import { Todo } from "components/todo/todo";
import { Weather } from "components/weather/weather";
import { Timer } from "components/timer/timer";
import { WidgetMenu } from "components/widget-menu/widget-menu";
import { DateService } from "services/dateService";
import { LocalStorageService } from "services/localStorageService";
import { SettingService } from "services/settingService";

@Component({
    selector: "app",
    directives: [Background, Time, MainBlock, Todo, Weather, WidgetMenu, Timer, CalendarReminders],
    template: `
        <background [setting]="settings.background"></background>
        <time [setting]="settings.time"></time>
        <calendar-reminders
            [setting]="settings.time"
            [newReminders]="reminders">
        </calendar-reminders>
        <main-block [setting]="settings.mainBlock"></main-block>
        <todo></todo>
        <weather [setting]="settings.weather"></weather>
        <timer [toggle]="toggle.timer"></timer>
        <widget-menu
            (toggle)="onToggle($event)"
            (setting)="onSetting($event)"
            (reminders)="onReminders($event)">
        </widget-menu>
    `
})
export class App {
    constructor() {
        this.toggle = {};
        this.settings = {};
    }

    onToggle(whatToToggle) {
        this.toggle[whatToToggle] = !this.toggle[whatToToggle] || false;
    }

    onSetting(settings) {
        this.settings = Object.assign(settings);
    }

    onReminders(reminders) {
        this.reminders = reminders;
    }
}

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./../sw.js");
}

enableProdMode();
bootstrap(App, [LocalStorageService, SettingService, DateService]);
