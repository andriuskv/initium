import { Component, Output, EventEmitter, Input } from "@angular/core";
import { FeedService } from "./../../services/feedService";
import { NotificationService } from "./../../services/notificationService";

@Component({
    selector: "rss-feed",
    templateUrl: "app/components/rss-feed/rss-feed.html"
})
export class RssFeed {
    @Output() newFeedEntries = new EventEmitter();
    @Output() toggleTab = new EventEmitter();
    @Input() item;

    static get parameters() {
        return [[FeedService], [NotificationService]];
    }

    constructor(feedService, notificationService) {
        this.feedService = feedService;
        this.notification = notificationService;
        this.feeds = [];
        this.feedsToLoad = JSON.parse(localStorage.getItem("rss feeds")) || [];
        this.addingNewFeed = false;
        this.activeFeed = "";
        this.latestActiveFeed = "";
        this.newEntryCount = 0;
        this.timeout = 0;
    }

    ngOnInit() {
        const delay = this.isActive ? 2000 : 10000;

        this.initTimeout = setTimeout(() => {
            this.initTimeout = null;
            this.loadFeeds(this.feedsToLoad);
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
                this.initTimeout = null;
                this.loadFeeds(this.feedsToLoad);
            }
        }
    }

    saveFeeds(feeds) {
        const feedsToSave = feeds.map(feed => ({
            url: feed.url,
            title: feed.title
        }));

        localStorage.setItem("rss feeds", JSON.stringify(feedsToSave));
    }

    getEntry(entry, newEntry = false) {
        let desc = "";

        if (entry.description) {
            desc = entry.description;
        }
        else if (typeof entry.content === "object") {
            desc = entry.content.content || "";
        }
        return {
            newEntry,
            desc,
            link: typeof entry.link === "string" ? entry.link : entry.link.href,
            title: entry.title,
            date: entry.pubDate || entry.updated || ""
        };
    }

    getEntries(entries, newEntries) {
        return entries.map(entry => this.getEntry(entry, newEntries));
    }

    addNewFeed() {
        this.addingNewFeed = !this.addingNewFeed;

        if (!this.addingNewFeed && this.latestActiveFeed) {
            this.activeFeed = this.latestActiveFeed;
            this.latestActiveFeed = "";
        }
        else {
            this.latestActiveFeed = this.activeFeed;
            this.activeFeed = "";
        }
    }

    removeFeed(index) {
        this.feeds.splice(index, 1);
        this.saveFeeds(this.feeds);

        if (this.feeds.length) {
            this.activeFeed = this.feeds[0].url;
            this.addingNewFeed = false;
        }
        else {
            this.addingNewFeed = true;
        }
    }

    loadFeeds(feeds) {
        if (!feeds.length) {
            this.addingNewFeed = true;
            return;
        }
        const feedsToLoad = feeds.map(feed => this.getFeed(feed.url, feed.title));

        Promise.all(feedsToLoad)
        .then(() => {
            this.addingNewFeed = false;
            this.activeFeed = this.activeFeed || this.feeds[0].url;
            clearTimeout(this.timeout);
            this.getNewFeeds(this.feeds);
        })
        .catch(error => {
            console.log(error);
        });
    }

    getNewFeeds(feeds) {
        if (feeds.length) {
            this.timeout = setTimeout(() => {
                this.updateFeeds(feeds);
                this.getNewFeeds(feeds);
            }, 1800000);
        }
    }

    updateFeeds(feeds) {
        const feedsToUpdate = feeds.map(feed => this.updateFeed(feed));

        Promise.all(feedsToUpdate)
        .then(newEntryCount => {
            newEntryCount = newEntryCount.reduce((sum, entryCount) => sum + entryCount, 0);

            if (!newEntryCount) {
                return;
            }
            this.newEntryCount += newEntryCount;

            if (!this.isActive) {
                this.newFeedEntries.emit(this.newEntryCount);
            }
            if (document.hidden) {
                this.notification.send("RSS feed", `You have ${this.newEntryCount} new entries`)
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

    updateFeed(feed) {
        return this.feedService.fetchFeed(feed.url)
            .then(newFeed => {
                if (!newFeed) {
                    return 0;
                }
                const urls = feed.entries.map(entry => entry.link);
                let newEntries = newFeed.entries.filter(entry => {
                    const link = typeof entry.link === "string" ? entry.link : entry.link.href;

                    return urls.indexOf(link) === -1;
                });

                if (newEntries.length) {
                    newEntries = this.getEntries(newEntries, true);
                    feed.entries.unshift(...newEntries);

                    if (this.activeFeed !== feed.url) {
                        feed.newEntries += newEntries.length;
                    }
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
            this.addingNewFeed = false;
            this.activeFeed = url.value;
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
                    entries: this.getEntries(feed.entries)
                });
            });
    }

    showFeed(feed) {
        if (this.addingNewFeed) {
            this.addingNewFeed = false;
        }

        if (feed.url !== this.activeFeed) {
            this.activeFeed = feed.url;
        }

        if (feed.newEntries > 0) {
            feed.newEntries = 0;
        }
    }

    removeNewEntryLabel(entry) {
        if (entry.newEntry) {
            entry.newEntry = false;
        }
    }
}
