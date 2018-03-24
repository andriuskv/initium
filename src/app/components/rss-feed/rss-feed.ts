import { Component, Output, EventEmitter, Input } from "@angular/core";
import { delay } from "../../utils/utils";
import { ChromeStorageService } from "../../services/chromeStorageService";
import { FeedService } from "../../services/feedService";
import { NotificationService } from "../../services/notificationService";

@Component({
    selector: "rss-feed",
    templateUrl: "./rss-feed.html"
})
export class RssFeed {
    @Output() newEntries = new EventEmitter();
    @Output() toggleTab = new EventEmitter();
    @Output() toggleSize = new EventEmitter();
    @Input() isVisible: boolean = false;

    loading: boolean = true;
    fetching: boolean = false;
    newEntryCount: number = 0;
    timeout: number = 0;
    initTimeout: number = 0;
    latestActiveFeed: string = "";
    message: string = "";
    feedsToLoad: Array<any> = [];
    feeds: Array<any> = [];
    activeFeed: any = null;

    constructor(
        private chromeStorageService: ChromeStorageService,
        private feedService: FeedService,
        private notificationService: NotificationService
    ) {
        this.chromeStorageService = chromeStorageService;
        this.feedService = feedService;
        this.notificationService = notificationService;
    }

    ngOnInit() {
        const delay = this.isVisible ? 2000 : 10000;

        this.initTimeout = window.setTimeout(() => {
            this.initFeeds();
        }, delay);
    }

    ngOnChanges() {
        if (this.isVisible) {
            if (this.newEntryCount) {
                this.newEntryCount = 0;
            }

            if (this.initTimeout) {
                clearTimeout(this.initTimeout);
                this.initFeeds();
            }
        }
    }

    initFeeds() {
        this.initTimeout = 0;
        this.chromeStorageService.subscribeToChanges(this.chromeStorageChangeHandler.bind(this));
        this.chromeStorageService.get("rss", storage => {
            this.feedsToLoad = storage.rss || [];
            this.loadFeeds(this.feedsToLoad);
        });
    }

    saveFeeds(feeds) {
        const feedsToSave = feeds.map(({ url, title }) => ({ url, title }));

        this.chromeStorageService.set({ rss: feedsToSave });
    }

    addNewFeed() {
        if (this.activeFeed) {
            this.latestActiveFeed = this.activeFeed;
            this.activeFeed = null;
        }
        else {
            this.activeFeed = this.latestActiveFeed;
            this.latestActiveFeed = null;
        }
    }

    removeFeed(index) {
        this.feeds.splice(index, 1);

        if (!this.feeds.length) {
            this.activeFeed = null;
            clearTimeout(this.timeout);
        }
        else {
            this.activeFeed = this.feeds[0];
        }
        this.saveFeeds(this.feeds);
    }

    async loadFeeds(feeds) {
        if (!feeds.length) {
            this.loading = false;
            this.activeFeed = null;
            this.feeds.length = 0;
            return;
        }
        const feedsToLoad = feeds.map(feed => {
            feed.isLoading = true;

            return this.feedService.getFeed(feed.url, feed.title).then(results => {
                feed.isLoading = false;

                if (results) {
                    feed.success = true;
                }
                else {
                    feed.error = true;
                }
                return results;
            });
        });
        const loadedFeeds = await Promise.all(feedsToLoad);
        await delay(1000);

        this.feeds = [...loadedFeeds].filter(feed => feed);

        if (!this.activeFeed || !this.feeds.some(({ url }) => url === this.activeFeed.url)) {
            this.activeFeed = this.feeds[0];
        }
        this.loading = false;
        feeds.length = 0;
        this.getNewFeeds();
    }

    getNewFeeds() {
        clearTimeout(this.timeout);
        this.timeout = window.setTimeout(() => {
            this.updateFeeds();
            this.getNewFeeds();
        }, 1500000);
    }

    async updateFeeds() {
        for (const feed of this.feeds) {
            await this.updateFeed(feed);
        }

        if (!this.newEntryCount) {
            return;
        }

        if (!this.isVisible) {
            this.newEntries.emit();
        }

        if (document.hidden) {
            this.notificationService.send(
                "RSS feed",
                `You have ${this.newEntryCount} new entries`,
                () => this.toggleTab.emit("rssFeed")
            );
        }
    }

    async updateFeed(feed) {
        const entries = await this.feedService.updateFeed(feed);

        if (entries.length) {
            feed.newEntryCount += entries.length;
            this.newEntryCount += entries.length;
            feed.entries.unshift(...entries);
        }
    }

    async handleFormSubmit(event) {
        event.preventDefault();

        if (!event.target.checkValidity()) {
            return;
        }
        const { elements } = event.target;
        const title = elements.title.value;
        const url = elements.url.value;
        this.fetching = true;

        try {
            const feed = await this.feedService.getFeed(url, title);

            if (!feed) {
                throw new Error("Feed was not found");
            }
            this.feeds.push(feed);
            this.activeFeed = feed;
            this.getNewFeeds();
            this.saveFeeds(this.feeds);
            event.target.reset();
        }
        catch (e) {
            console.log(e);
            this.message = e.message;

            setTimeout(() => {
                this.message = "";
            }, 4000);
        }
        finally {
            this.fetching = false;
        }
    }

    showFeed(feed) {
        if (!this.activeFeed || feed.url !== this.activeFeed.url) {
            this.activeFeed = feed;
        }
    }

    markEntriesAsRead(feed) {
        feed.newEntryCount = 0;
        feed.entries = feed.entries.map(entry => {
            entry.newEntry = false;
            return entry;
        });
    }

    markEntryAsRead(entry) {
        if (entry.newEntry) {
            this.activeFeed.newEntryCount -= 1;
            entry.newEntry = false;
        }
    }

    chromeStorageChangeHandler({ rss }) {
        if (rss) {
            this.loadFeeds(rss.newValue);
        }
    }

    toggleContainerSize() {
        this.toggleSize.emit();
    }
}
