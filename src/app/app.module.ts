import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";

import { TimeDateService } from "./services/timeDateService";
import { SettingService } from "./services/settingService";
import { WeatherService } from "./services/weatherService";
import { NotificationService } from "./services/notificationService";
import { FeedService } from "./services/feedService";
import { ZIndexService } from "./services/zIndexService";

import { SlicePipe } from "./pipes/slicePipe";
import { PadTimePipe } from "./pipes/padTimePipe";

import { App } from "./app.component";
import { Background } from "./components/background/background";
import { Time } from "./components/time/time";
import { MainBlock } from "./components/main-block/main-block";
import { MostVisited } from "./components/most-visited/most-visited";
import { Notepad } from "./components/notepad/notepad";
import { Twitter } from "./components/twitter/twitter";
import { RssFeed } from "./components/rss-feed/rss-feed";
import { Todo } from "./components/todo/todo";
import { Weather } from "./components/weather/weather";
import { Menu } from "./components/menu/menu";
import { UpperBlock } from "./components/upper-block/upper-block";
import { Timer } from "./components/timer/timer";
import { Stopwatch } from "./components/stopwatch/stopwatch";
import { Pomodoro } from "./components/pomodoro/pomodoro";
import { Settings } from "./components/settings/settings";
import { DropboxComp } from "./components/dropbox/dropbox";
import { Calendar } from "./components/calendar/calendar";
import { CalendarSelectedDay } from "./components/calendar-selected-day/calendar-selected-day";
import { TweetImageViewer } from "./components/tweet-image-viewer/tweet-image-viewer";

@NgModule({
    imports: [BrowserModule, FormsModule],
    providers: [SettingService, TimeDateService, WeatherService, NotificationService, FeedService, ZIndexService],
    declarations: [
        App, Settings, Background, Time, MainBlock, MostVisited, Notepad, Twitter, RssFeed,
        Weather, Menu, Todo, UpperBlock, Timer, Stopwatch, Pomodoro, Calendar,
        CalendarSelectedDay, DropboxComp, TweetImageViewer, SlicePipe, PadTimePipe
    ],
    bootstrap: [App]
})
export class AppModule {}
