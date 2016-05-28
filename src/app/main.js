import { Component, enableProdMode } from "@angular/core";
import { bootstrap } from "@angular/platform-browser-dynamic";
import { Background } from "app/components/background/background";
import { Time } from "app/components/time/time";
import { ReminderNotification } from "app/components/reminder-notification/reminder-notification";
import { MainBlock } from "app/components/main-block/main-block";
import { Todo } from "app/components/todo/todo";
import { Weather } from "app/components/weather/weather";
import { Timer } from "app/components/timer/timer";
import { WidgetMenu } from "app/components/widget-menu/widget-menu";
import { DateService } from "app/services/dateService";
import { LocalStorageService } from "app/services/localStorageService";

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
