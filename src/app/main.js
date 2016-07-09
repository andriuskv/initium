import { Component, enableProdMode } from "@angular/core";
import { bootstrap } from "@angular/platform-browser-dynamic";
import { Background } from "components/background/background";
import { Time } from "components/time/time";
import { ReminderNotification } from "components/reminder-notification/reminder-notification";
import { MainBlock } from "components/main-block/main-block";
import { Todo } from "components/todo/todo";
import { Weather } from "components/weather/weather";
import { Timer } from "components/timer/timer";
import { WidgetMenu } from "components/widget-menu/widget-menu";
import { DateService } from "services/dateService";
import { LocalStorageService } from "services/localStorageService";

@Component({
    selector: "app",
    directives: [Background, Time, MainBlock, Todo, Weather, WidgetMenu, Timer, ReminderNotification],
    template: `
        <background [setting]="setting.background" [newBackground]="background"></background>
        <time [setting]="setting.time"></time>
        <reminders
            [setting]="setting.reminders"
            [newReminders]="reminders">
        </reminders>
        <main-block [setting]="setting.mostVisited"></main-block>
        <todo></todo>
        <weather [setting]="setting.weather"></weather>
        <timer [toggle]="toggle.timer"></timer>
        <widget-menu
            (toggle)="onToggle($event)"
            (setting)="onSetting($event)"
            (background)="onBackground($event)"
            (reminders)="onReminders($event)">
        </widget-menu>
    `
})
export class App {
    constructor() {
        this.toggle = {};
        this.setting = {};
    }

    onToggle(whatToToggle) {
        this.toggle[whatToToggle] = !this.toggle[whatToToggle] || false;
    }

    onSetting(setting) {
        this.setting[setting.for] = setting;
    }

    onBackground(background) {
        this.background = background;
    }

    onReminders(reminders) {
        this.reminders = reminders;
    }
}

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./../sw.js");
}

enableProdMode();
bootstrap(App, [LocalStorageService, DateService]);
