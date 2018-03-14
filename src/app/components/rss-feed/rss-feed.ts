import { Component, Output, EventEmitter, Input } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
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
        private notificationService: NotificationService,
        private domSanitizer: DomSanitizer
    ) {
        this.chromeStorageService = chromeStorageService;
        this.feedService = feedService;
        this.notificationService = notificationService;
        this.domSanitizer = domSanitizer;
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

    getEntryLink(entry) {
        if (typeof entry.link === "string") {
            return entry.link;
        }

        if (entry.link && entry.link.href) {
            return entry.link.href;
        }

        if (entry.origEnclosureLink) {
            return entry.origEnclosureLink;
        }
    }

    getEntryDesc(entry) {
        if (entry.subtitle) {
            return entry.subtitle;
        }

        if (entry.description) {
            return entry.description;
        }

        if (typeof entry.content === "object") {
            return entry.content.content || "";
        }
    }

    parseEntries(entries, newEntry) {
        return entries.map(entry => ({
            newEntry,
            desc: this.domSanitizer.bypassSecurityTrustHtml(this.getEntryDesc(entry)),
            link: this.getEntryLink(entry),
            title: entry.title,
            date: entry.pubDate || entry.updated || ""
        }));
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

            return this.getFeed(feed.url, feed.title).then(results => {
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

    getNewEntries(newFeed, feed) {
        return newFeed.entries.filter(newEntry => {
            const link = this.getEntryLink(newEntry);
            const title = newEntry.title;
            const duplicate = feed.entries.some(entry => entry.link === link || entry.title === title);

            return !duplicate;
        });
    }

    async updateFeed(feed) {
        const updatedFeed = await this.feedService.fetchFeed(feed.url);

        if (!updatedFeed) {
            return;
        }
        let entries = this.getNewEntries(updatedFeed, feed);

        if (entries.length) {
            entries = this.parseEntries(entries, true);
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
            const feed = await this.getFeed(url, title);

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

    getFeed(url, title) {
        return this.feedService.fetchFeed(url).then(feed => {
            if (feed) {
                return {
                    url,
                    title: title || feed.title || `RSS Feed ${this.feeds.length + 1}`,
                    newEntryCount: 0,
                    entries: this.parseEntries(feed.entries, false)
                };
            }
        });
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
}
