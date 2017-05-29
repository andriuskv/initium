/* global chrome */

import { Component, Output, EventEmitter, Input } from "@angular/core";
import { FeedService } from "../../services/feedService";
import { NotificationService } from "../../services/notificationService";

@Component({
    selector: "rss-feed",
    templateUrl: "app/components/rss-feed/rss-feed.html"
})
export class RssFeed {
    @Output() newEntries = new EventEmitter();
    @Output() toggleTab = new EventEmitter();
    @Input() item;

    static get parameters() {
        return [[FeedService], [NotificationService]];
    }

    constructor(feedService, notificationService) {
        this.feedService = feedService;
        this.notification = notificationService;
        this.feeds = [];
        this.feedsToLoad = [];
        this.activeFeed = "";
        this.latestActiveFeed = "";
        this.newEntryCount = 0;
        this.timeout = 0;
        this.loading = true;
    }

    ngOnInit() {
        const delay = this.isActive ? 2000 : 10000;

        this.initTimeout = setTimeout(() => {
            chrome.storage.sync.get("rss", storage => {
                this.feedsToLoad = storage.rss || JSON.parse(localStorage.getItem("rss feeds")) || [];
                this.loadFeeds(this.feedsToLoad);
            });
        }, delay);
    }

    ngOnChanges(changes) {
        this.isActive = changes.item.currentValue === "rssFeed";

        if (this.isActive) {
            if (this.newEntryCount) {
                this.newEntryCount = 0;
            }
            if (this.initTimeout) {
                clearTimeout(this.initTimeout);
                this.loadFeeds(this.feedsToLoad);
            }
        }
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
            this.activeFeed = "";
        }
        else {
            this.activeFeed = this.latestActiveFeed;
            this.latestActiveFeed = "";
        }
    }

    removeFeed(index) {
        this.feeds.splice(index, 1);
        this.saveFeeds(this.feeds);
        this.activeFeed = this.feeds.length ? this.feeds[0].url : "";
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
            this.activeFeed = this.activeFeed || this.feeds[0].url;
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

        Promise.all(feedsToUpdate)
        .then(newEntryCount => {
            newEntryCount = newEntryCount.reduce((sum, entryCount) => sum + entryCount, 0);

            if (!newEntryCount) {
                return;
            }
            this.newEntryCount += newEntryCount;

            if (!this.isActive) {
                this.newEntries.emit(true);
            }
            if (document.hidden) {
                this.notification.send(
                    "RSS feed",
                    `You have ${this.newEntryCount} new entries`
                )
                .then(disabled => {
                    if (!disabled) {
                        this.toggleTab.emit("rssFeed");
                    }
                });
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

    getFeedFromInput(url, title) {
        if (!url.value || this.fetching) {
            return;
        }
        this.fetching = true;
        this.getFeed(url.value, title.value)
        .then(message => {
            this.fetching = false;

            if (message) {
                this.message = message;
                setTimeout(() => {
                    this.message = "";
                }, 4000);
                return;
            }
            this.activeFeed = url.value;
            this.getNewFeeds();
            this.saveFeeds(this.feeds);
        });
    }

    getFeed(url, title) {
        return this.feedService.fetchFeed(url)
            .then(feed => {
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
        if (feed.url !== this.activeFeed) {
            this.activeFeed = feed.url;
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
        entry.newEntry = false;
        feed.newEntries = feed.entries.reduce((count, entry) => {
            if (entry.newEntry) {
                count += 1;
            }
            return count;
        }, 0);
    }
}
