/* global chrome */

import { Component, Output, EventEmitter, Input } from "@angular/core";
import { FeedService } from "../../services/feedService";
import { NotificationService } from "../../services/notificationService";

declare const chrome;

@Component({
    selector: "rss-feed",
    templateUrl: "./rss-feed.html"
})
export class RssFeed {
    @Output() newEntries = new EventEmitter();
    @Output() toggleTab = new EventEmitter();
    @Input() item;

    loading: boolean = true;
    fetching: boolean = false;
    isVisible: boolean = false;
    newEntryCount: number = 0;
    timeout: number = 0;
    initTimeout: number = 0;
    latestActiveFeed: string = "";
    message: string = "";
    feeds: Array<any> = [];
    feedsToLoad: Array<any> = [];
    activeFeed: any = null;

    constructor(private feedService: FeedService, private notificationService: NotificationService) {
        this.feedService = feedService;
        this.notificationService = notificationService;
    }

    ngOnInit() {
        const delay = this.isVisible ? 2000 : 10000;

        this.initTimeout = setTimeout(() => {
            this.initFeeds();
        }, delay);
    }

    ngOnChanges() {
        this.isVisible = this.item === "rssFeed";

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
        chrome.storage.sync.get("rss", storage => {
            this.feedsToLoad = storage.rss || [];
            this.loadFeeds(this.feedsToLoad);
        });
    }

    saveFeeds(feeds) {
        const feedsToSave = feeds.map(feed => ({
            url: feed.url,
            title: feed.title
        }));

        chrome.storage.sync.set({ rss:  feedsToSave });
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

    parseEntries(entries, newEntry = false) {
        return entries.map(entry => ({
            newEntry,
            desc: this.getEntryDesc(entry),
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
        this.saveFeeds(this.feeds);
        this.activeFeed = this.feeds.length ? this.feeds[0] : null;
    }

    loadFeeds(feeds) {
        this.initTimeout = null;

        if (!feeds.length) {
            this.loading = false;
            return;
        }
        const feedsToLoad = feeds.map(feed => this.getFeed(feed.url, feed.title));

        Promise.all(feedsToLoad)
        .then(() => {
            this.loading = false;
            this.activeFeed = this.activeFeed || this.feeds[0];
            this.feedsToLoad.length = 0;
            this.getNewFeeds();
        })
        .catch(error => {
            this.loading = false;
            console.log(error);
        });
    }

    getNewFeeds() {
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            if (this.feeds.length) {
                this.updateFeeds();
            }
            this.getNewFeeds();
        }, 1500000);
    }

    updateFeeds() {
        const feedsToUpdate = this.feeds.map(feed => this.updateFeed(feed));

        Promise.all(feedsToUpdate).then(newEntryCount => {
            const entryCountSum: number = newEntryCount.reduce((sum, entryCount) => sum + entryCount, 0);

            if (!entryCountSum) {
                return;
            }
            this.newEntryCount += entryCountSum;

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
        })
        .catch(error => {
            console.log(error);
        });
    }

    getNewEntries(newFeed, feed) {
        return newFeed.entries.filter(newEntry => {
            const link = this.getEntryLink(newEntry);
            const title = newEntry.title;
            const duplicate = feed.entries.some(entry => entry.link === link || entry.title === title);

            return !duplicate;
        });
    }

    updateFeed(feed) {
        return this.feedService.fetchFeed(feed.url)
            .then(newFeed => {
                if (!newFeed) {
                    return 0;
                }
                let newEntries = this.getNewEntries(newFeed, feed);

                if (newEntries.length) {
                    newEntries = this.parseEntries(newEntries, true);
                    feed.newEntries += newEntries.length;
                    feed.entries.unshift(...newEntries);
                }
                return newEntries.length;
            });
    }

    handleFormSubmit(event) {
        event.preventDefault();

        if (!event.target.checkValidity()) {
            return;
        }
        const { elements } = event.target;
        const title = elements.title.value;
        const url = elements.url.value;
        this.fetching = true;

        this.getFeed(url, title).then(message => {
            this.fetching = false;

            if (message) {
                this.message = message;

                setTimeout(() => {
                    this.message = "";
                }, 4000);
                return;
            }
            this.activeFeed = this.feeds[this.feeds.length - 1];
            this.getNewFeeds();
            this.saveFeeds(this.feeds);
            event.target.reset();
        })
        .catch(error => {
            console.log(error);
        });
    }

    getFeed(url, title) {
        return this.feedService.fetchFeed(url).then(feed => {
            if (!feed) {
                return "No feed found";
            }
            this.feeds.push({
                url,
                title: title || feed.title || `RSS Feed ${this.feeds.length + 1}`,
                newEntries: 0,
                entries: this.parseEntries(feed.entries)
            });
        });
    }

    showFeed(feed) {
        if (!this.activeFeed || feed.url !== this.activeFeed.url) {
            this.activeFeed = feed;
        }
    }

    markEntriesAsRead(feed) {
        feed.newEntries = 0;
        feed.entries = feed.entries.map(entry => {
            entry.newEntry = false;
            return entry;
        });
    }

    markEntryAsRead(feed, entry) {
        feed.newEntries -= 1;
        entry.newEntry = false;
    }
}
