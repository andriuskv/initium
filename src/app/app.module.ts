import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from '@angular/forms';

import { DateService } from "./services/dateService";
import { SettingService } from "./services/settingService";
import { WeatherService } from "./services/weatherService";
import { NotificationService } from "./services/notificationService";
import { FeedService } from "./services/feedService";

import { SlicePipe } from "./pipes/slicePipe";

import { App } from './app.component';
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
import { TweetImageViewer } from "./components/tweet-image-viewer/tweet-image-viewer";

@NgModule({
    imports: [BrowserModule, FormsModule],
    providers: [SettingService, DateService, WeatherService, NotificationService, FeedService],
    declarations: [
        App, Settings, Background, Time, MainBlock, MainBlockNav, MainBlockContent,
        MostVisited, Notepad, Twitter, RssFeed, CalendarReminders, Weather,
        WidgetMenu, TodoPin, Todo, UpperBlock,Timer, Stopwatch, Calendar,
        CalendarSelectedDay, DropboxComp, TweetImageViewer, SlicePipe
    ],
    bootstrap: [App]
})
export class AppModule {}
