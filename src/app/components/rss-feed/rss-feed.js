import { Component, Output, EventEmitter, Input } from "@angular/core";
import { FeedService } from "services/feedService";
import { NotificationService } from "services/notificationService";

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
        this.editingFeed = false;
        this.activeFeed = "";
        this.latestActiveFeed = "";
        this.feedInput = {};
        this.action = "Add";
        this.newEntryCount = 0;
        this.timeout = 0;
    }

    ngOnInit() {
        this.initTimeout = setTimeout(() => {
            this.initTimeout = null;
            this.loadFeeds(this.feedsToLoad);
        }, 10000);
    }

    ngOnChanges(changes) {
        this.isActive = changes.item.currentValue === "rssFeed";

        if (this.isActive && this.newEntryCount) {
            this.newEntryCount = 0;
        }

        if (this.isActive && this.initTimeout) {
            clearTimeout(this.initTimeout);
            this.initTimeout = null;
            this.loadFeeds(this.feedsToLoad);
        }
    }

    htmlDecode(input) {
        const doc = new DOMParser().parseFromString(input, "text/html");

        return doc.documentElement.textContent;
    }

    getEntry(entry, newEntry) {
        return {
            newEntry,
            link: entry.link,
            title: entry.title,
            desc: this.htmlDecode(entry.contentSnippet),
            date: entry.publishedDate ? new Date(entry.publishedDate) : ""
        };
    }

    getEntries(entries) {
        return entries.map(entry => this.getEntry(entry));
    }

    addNewFeed() {
        this.addingNewFeed = !this.addingNewFeed;
        this.action = "Add";
        this.feedInput = {};

        if (this.editingFeed) {
            this.editingFeed = false;
        }

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
        localStorage.setItem("rss feeds", JSON.stringify(this.feeds));

        if (this.feeds.length) {
            this.activeFeed = this.feeds[0].url;
            this.addingNewFeed = false;
        }
        else {
            this.addingNewFeed = true;
        }
    }

    enableFeedEdit(index) {
        this.action = "Edit";
        this.addingNewFeed = true;
        this.editingFeed = true;
        this.feedInput = {
            index,
            url: this.feeds[index].url,
            title: this.feeds[index].title
        };
        this.latestActiveFeed = this.activeFeed;
        this.activeFeed = "";
    }

    resetInputs() {
        this.addingNewFeed = false;
        this.editingFeed = false;
        this.feedInput = {};
    }

    editFeed(url, title) {
        const index = this.feedInput.index;

        if (url.value && url.value !== this.feedInput.url) {
            this.feedService.fetchFeed(url.value)
            .then(feed => {
                this.feeds[index] = {
                    title: title.value || this.feedInput.title,
                    url: url.value,
                    entries: this.getEntries(feed.entries)
                };
            });
        }
        else if (title.value && title.value !== this.feedInput.title) {
            this.feeds[index].title = title.value;
        }
        this.activeFeed = this.feeds[index].url;
        this.resetInputs();
        localStorage.setItem("rss feeds", JSON.stringify(this.feeds));
    }

    loadFeeds(feeds) {
        if (feeds.length) {
            const feedsToLoad = feeds.map((feed, index) => this.getFeed(feed.url, feed.title, index));

            Promise.all(feedsToLoad)
            .then(() => {
                this.addingNewFeed = false;
                this.activeFeed = this.feeds[0].url;
                clearTimeout(this.timeout);
                this.getNewFeeds(this.feeds);
            })
            .catch(error => {
                console.log(error);
            });
        }
        else {
            this.addingNewFeed = true;
        }
    }

    getNewFeeds(feeds) {
        if (feeds.length) {
            this.timeout = setTimeout(() => {
                this.updateFeeds(feeds);
                this.getNewFeeds(feeds);
            }, 600000);
        }
    }

    updateFeeds(feeds) {
        const feedsToUpdate = feeds.map((feed, index) => this.updateFeed(feed.url, index));

        Promise.all(feedsToUpdate)
        .then(newEntryCount => {
            newEntryCount = newEntryCount.reduce((sum, entryCount) => sum + entryCount, 0);

            if (newEntryCount) {
                this.newEntryCount += newEntryCount;

                if (!this.isActive) {
                    this.newFeedEntries.emit(this.newEntryCount);
                }
                this.notification.send("RSS feed", `You have ${this.newEntryCount} new entries.`)
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

    updateFeed(url, index) {
        return this.feedService.fetchFeed(url)
        .then(feed => {
            const urls = this.feeds[index].entries.map(entry => entry.link),
                newEntries = feed.entries.filter(entry => urls.indexOf(entry.link) === -1)
                .map(entry => this.getEntry(entry, true));

            if (newEntries.length) {
                this.feeds[index].entries.unshift(...newEntries);

                if (this.activeFeed !== this.feeds[index].url) {
                    this.feeds[index].newEntries += newEntries.length;
                }
            }
            return newEntries.length || 0;
        })
        .catch(error => {
            console.log(error);
        });
    }

    getFeedFromInput(url, title) {
        if (url.value) {
            this.getFeed(url.value, title.value)
            .then(() => {
                this.resetInputs();
                clearTimeout(this.timeout);
                this.updateFeeds(this.feeds);
                localStorage.setItem("rss feeds", JSON.stringify(this.feeds));
            });
        }
    }

    getFeed(url, title, index) {
        if (typeof index === "number") {
            this.feeds[index] = {};
        }

        return this.feedService.fetchFeed(url)
            .then(feed => {
                const newFeed = {
                    url,
                    title: title || feed.title || `RSS Feed ${this.feeds.length + 1}`,
                    newEntries: 0,
                    entries: this.getEntries(feed.entries)
                };

                if (typeof index === "number") {
                    this.feeds[index] = newFeed;
                }
                else {
                    this.feeds.push(newFeed);
                    this.activeFeed = url;
                }
            });
    }

    showFeed(url, index) {
        if (this.addingNewFeed) {
            this.addingNewFeed = false;
        }

        if (this.editingFeed) {
            this.editingFeed = false;
        }

        if (url !== this.activeFeed) {
            this.activeFeed = url;
        }

        if (this.feeds[index].newEntries > 0) {
            this.feeds[index].newEntries = 0;
        }
    }

    removeNewEntryLabel(entry) {
        if (entry.newEntry) {
            entry.newEntry = false;
        }
    }
}
