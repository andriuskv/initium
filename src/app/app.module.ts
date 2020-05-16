import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { DragDropModule } from "@angular/cdk/drag-drop";

import { App } from "./app.component";
import { Background } from "./components/background/background";
import { Time } from "./components/time/time";
import { MainBlock } from "./components/main-block/main-block";
import { TopSites } from "./components/top-sites/top-sites";
import { Notepad } from "./components/notepad/notepad";
import { Twitter } from "./components/twitter/twitter";
import { RssFeed } from "./components/rss-feed/rss-feed";
import { Tasks } from "./components/tasks/tasks";
import { Weather } from "./components/weather/weather";
import { WidgetMenu } from "./components/widget-menu/widget-menu";
import { UpperBlock } from "./components/upper-block/upper-block";
import { Timer } from "./components/timer/timer";
import { Stopwatch } from "./components/stopwatch/stopwatch";
import { Pomodoro } from "./components/pomodoro/pomodoro";
import { Countdown } from "./components/countdown/countdown";
import { Settings } from "./components/settings/settings";
import { Dropbox } from "./components/dropbox/dropbox";
import { Calendar } from "./components/calendar/calendar";
import { CalendarSelectedDay } from "./components/calendar-selected-day/calendar-selected-day";
import { TweetImageViewer } from "./components/tweet-image-viewer/tweet-image-viewer";
import { BackgroundViewer } from "./components/background-viewer/background-viewer";
import { GoogleApps } from "./components/google-apps/google-apps";
import { Storage } from "./components/storage/storage";
import { ResizeDirective } from "./directives/resize";

@NgModule({
    imports: [BrowserModule, DragDropModule],
    declarations: [
        App, Settings, Background, Time, MainBlock, TopSites, Notepad, Twitter, RssFeed,
        Weather, WidgetMenu, Tasks, UpperBlock, Timer, Stopwatch, Pomodoro, Countdown, Calendar,
        CalendarSelectedDay, Dropbox, TweetImageViewer, BackgroundViewer, GoogleApps,
        Storage, ResizeDirective
    ],
    bootstrap: [App]
})
export class AppModule {}
