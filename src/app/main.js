import "core-js/es7/reflect";
import "zone.js/dist/zone";

import { NgModule, enableProdMode } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { FormsModule } from '@angular/forms';

import { DateService } from "./services/dateService";
import { SettingService } from "./services/settingService";
import { WeatherService } from "./services/weatherService";
import { NotificationService } from "./services/notificationService";
import { FeedService } from "./services/feedService";

import { SlicePipe } from "./pipes/slicePipe";

import { App } from './app';
import { Background } from "./components/background/background";
import { Time } from "./components/time/time";
import { MainBlock } from "./components/main-block/main-block";
import { MainBlockNav } from "./components/main-block-nav/main-block-nav";
import { MainBlockContent } from "./components/main-block-content/main-block-content";
import { MostVisited } from "./components/most-visited/most-visited";
import { Notepad } from "./components/notepad/notepad";
import { Twitter } from "./components/twitter/twitter";
import { RssFeed } from "./components/rss-feed/rss-feed";
import { CalendarReminders } from "./components/calendar-reminders/calendar-reminders";
import { Todo } from "./components/todo/todo";
import { TodoPin } from "./components/todo-pin/todo-pin";
import { Weather } from "./components/weather/weather";
import { WidgetMenu } from "./components/widget-menu/widget-menu";
import { UpperBlock } from "./components/upper-block/upper-block";
import { Timer } from "./components/timer/timer";
import { Stopwatch } from "./components/stopwatch/stopwatch";
import { Settings } from "./components/settings/settings";
import { DropboxComp } from "./components/dropbox/dropbox";
import { Calendar } from "./components/calendar/calendar";
import { CalendarSelectedDay } from "./components/calendar-selected-day/calendar-selected-day";

@NgModule({
    imports: [BrowserModule, FormsModule],
    providers: [SettingService, DateService, WeatherService, NotificationService, FeedService],
    declarations: [
        App, Settings, Background, Time, MainBlock, MainBlockNav, MainBlockContent,
        MostVisited, Notepad, Twitter, RssFeed, CalendarReminders, Weather,
        WidgetMenu, TodoPin, Todo, UpperBlock,Timer, Stopwatch, Calendar,
        CalendarSelectedDay, DropboxComp, SlicePipe
    ],
    bootstrap: [App]
})
class AppModule {}

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
}
enableProdMode();
platformBrowserDynamic().bootstrapModule(AppModule);
