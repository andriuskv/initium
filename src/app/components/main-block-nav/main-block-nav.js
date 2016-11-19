import { Component, Output, EventEmitter, Input } from "@angular/core";

@Component({
    selector: "main-block-nav",
    templateUrl: "app/components/main-block-nav/main-block-nav.html"
})
export class MainBlockNav {
    @Output() choice = new EventEmitter();
    @Input() setting;
    @Input() newTweets;
    @Input() newEntries;
    @Input() tabNameChange;

    constructor() {
        this.favorite = localStorage.getItem("favorite tab");
        this.item = this.favorite || "mostVisited";
        this.isNewTweet = false;
        this.isNewEntry = false;
        this.tweetCount = 0;
        this.entryCount = 0;
    }

    ngOnInit() {
        this.choice.emit(this.item);
    }

    ngOnChanges(changes) {
        if (changes.newTweets && typeof changes.newTweets.currentValue === "number") {
            const newTweets = changes.newTweets.currentValue || 0;

            this.isNewTweet = this.tweetCount !== newTweets;
            this.tweetCount = newTweets;

            if (this.tweetCount > 99) {
                this.tweetCount = "99+";
            }

            setTimeout(() => {
                this.isNewTweet = false;
            }, 1000);
            return;
        }

        if (changes.newEntries && typeof changes.newEntries.currentValue === "number") {
            const newEntries = changes.newEntries.currentValue || 0;

            this.isNewEntry = this.entryCount !== newEntries;
            this.entryCount = newEntries;

            if (this.entryCount > 99) {
                this.entryCount = "99+";
            }

            setTimeout(() => {
                this.isNewEntry = false;
            }, 1000);
            return;
        }

        if (changes.tabNameChange && changes.tabNameChange.currentValue) {
            this.selectItem(changes.tabNameChange.currentValue.name);
            return;
        }

        if (changes.setting && changes.setting.currentValue) {
            const setting = changes.setting.currentValue;

            if (typeof setting.hideItemBar === "boolean") {
                this.hideBar = setting.hideItemBar;
            }
        }
    }

    selectItem(item) {
        this.item = item;

        if (item === "twitter" && Number.parseInt(this.tweetCount, 10) > 0) {
            this.tweetCount = 0;
        }
        else if (item === "rssFeed" && Number.parseInt(this.entryCount, 10) > 0) {
            this.entryCount = 0;
        }
        this.choice.emit(item);
    }

    makeFavorite() {
        this.favorite = this.favorite !== this.item ? this.item : "";
        localStorage.setItem("favorite tab", this.favorite);
    }
}
