import { Component, Output, EventEmitter, Input } from "@angular/core";
import { LocalStorageService } from "app/services/localStorageService";

@Component({
    selector: "main-block-nav",
    templateUrl: "app/components/main-block-nav/main-block-nav.html"
})
export class MainBlockNav {
    @Output() choice = new EventEmitter();
    @Input() newTweets;
    @Input() newEntries;

    static get parameters() {
        return [[LocalStorageService]];
    }

    constructor(localStorageService) {
        this.storage = localStorageService;
        this.favorite = this.storage.get("favorite tab");
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
        if (changes.newTweets && changes.newTweets.currentValue) {
            const newTweets = changes.newTweets.currentValue || 0;

            this.isNewTweet = this.tweetCount !== newTweets;
            this.tweetCount = newTweets;

            if (this.tweetCount > 99) {
                this.tweetCount = "99+";
            }

            setTimeout(() => {
                this.isNewTweet = false;
            }, 1000);
        }

        if (changes.newEntries && changes.newEntries.currentValue) {
            const newEntries = changes.newEntries.currentValue || 0;

            this.isNewEntry = this.entryCount !== newEntries;
            this.entryCount = newEntries;

            if (this.entryCount > 99) {
                this.entryCount = "99+";
            }

            setTimeout(() => {
                this.isNewEntry = false;
            }, 1000);
        }
    }

    chooseItem(item) {
        if (this.item === item) {
            this.item = "";
        }
        else {
            this.item = item;
            if (this.item === "twitter" && Number.parseInt(this.tweetCount, 10) > 0) {
                this.tweetCount = 0;
            }

            if (this.item === "rssFeed" && Number.parseInt(this.entryCount, 10) > 0) {
                this.entryCount = 0;
            }
        }
        this.choice.emit(this.item);
    }

    makeFavorite() {
        this.favorite = this.favorite !== this.item ? this.item : "";
        this.storage.set("favorite tab", this.favorite);
    }
}
