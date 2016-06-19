import { Component, Output, EventEmitter, Input } from "@angular/core";
import { MostVisited } from "app/components/most-visited/most-visited";
import { Notepad } from "app/components/notepad/notepad";
import { Twitter } from "app/components/twitter/twitter";
import { RssFeed } from "app/components/rss-feed/rss-feed";

@Component({
    selector: "main-block-content",
    directives: [MostVisited, Notepad, Twitter, RssFeed],
    templateUrl: "app/components/main-block-content/main-block-content.html"
})
export class MainBlockContent {
    @Input() choice;
    @Input() setting;
    @Output() newTweets = new EventEmitter();
    @Output() newEntries = new EventEmitter();
    @Output() toggleTab = new EventEmitter();

    constructor() {
        this.item = "";
    }

    ngOnChanges(changes) {
        if (changes.choice && typeof changes.choice.currentValue === "string") {
            this.item = changes.choice.currentValue;
        }
        else if (changes.setting && changes.setting.currentValue) {
            this.mostVisitedSetting = changes.setting.currentValue;
        }
    }

    onNewTweets(count) {
        this.newTweets.emit(count);
    }

    onNewEntries(count) {
        this.newEntries.emit(count);
    }

    onToggleTab(item) {
        this.toggleTab.emit(item);
    }
}
