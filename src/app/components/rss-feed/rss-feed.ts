import { Component, Output, EventEmitter, Input, ViewChild } from "@angular/core";
import { moveItemInArray } from "@angular/cdk/drag-drop";
import { ChromeStorageService } from "../../services/chromeStorageService";
import { FeedService } from "../../services/feedService";
import { NotificationService } from "../../services/notificationService";

@Component({
    selector: "rss-feed",
    templateUrl: "./rss-feed.html",
    styleUrls: ["./rss-feed.scss"]
})
export class RssFeed {
    @Output() newEntries = new EventEmitter();
    @Output() toggleTab = new EventEmitter();
    @Input() isVisible = false;
    @ViewChild("feedTitleInput") feedTitleInput;
    @ViewChild("feedEntryContainer") feedEntryContainer;

    initializing = true;
    fetching = false;
    showingFeedList = false;
    showingForm = false;
    showingFormCloseButton = false;
    animatingRight = false;
    animatingLeft = false;
    VISIBLE_FEED_COUNT = 3;
    newEntryCount = 0;
    timeout = 0;
    initTimeout = 0;
    shift = 0;
    activeFeedIndex = 0;
    message = "";
    feedsToLoad = [];
    feeds = [];
    activeFeed = null;

    constructor(
        private chromeStorageService: ChromeStorageService,
        private feedService: FeedService,
        private notificationService: NotificationService
    ) {}

    ngOnInit() {
        const delay = this.isVisible ? 2000 : 10000;

        this.initTimeout = window.setTimeout(() => {
            this.initFeeds();
        }, delay);
    }

    ngOnChanges() {
        this.newEntryCount = 0;

        if (this.isVisible && this.initTimeout) {
            clearTimeout(this.initTimeout);
            this.initFeeds();
        }
    }

    initFeeds() {
        this.initTimeout = 0;
        this.chromeStorageService.subscribeToChanges(({ feeds }) => {
            if (feeds) {
                this.syncFeeds(feeds.newValue);
            }
        });
        this.chromeStorageService.get("feeds", ({ feeds }) => {
            this.feedsToLoad = feeds || [];
            this.loadFeeds(this.feedsToLoad);
        });
    }

    async syncFeeds(feeds) {
        const length = Math.max(feeds.length, this.feeds.length);

        for (let i = 0; i < length; i++) {
            if (feeds[i]) {
                const match = this.feeds.find(({ url }) => feeds[i].url === url);

                if (!match) {
                    try {
                        const feed = await this.feedService.getFeed(feeds[i].url, feeds[i].title);

                        this.feeds.push(feed);
                    } catch (e) {
                        console.log(e);
                        this.feedsToLoad.push(feeds[i]);
                    }
                }
                else if (match.title !== feeds[i].title) {
                    match.title = feeds[i].title;
                }
            }

            if (this.feeds[i] && !feeds.some(({ url }) => this.feeds[i].url === url)) {
                this.removeFeed(i, true);
            }
        }
    }

    showFeed(index = 0) {
        this.activeFeedIndex = index;
        this.activeFeed = this.feeds[index];
        this.resetScrollPosition();
    }

    previousVisibleFeeds() {
        this.shift -= 1;

        if (this.activeFeedIndex >= this.shift + this.VISIBLE_FEED_COUNT) {
            this.showFeed(this.activeFeedIndex - 1);
        }

        if (this.animatingLeft) {
            const hasNewEntries = this.feeds.slice(0, this.shift)
                .some(({ newEntryCount }) => newEntryCount > 0);

            if (!hasNewEntries) {
                this.animatingLeft = false;
            }
        }
    }

    nextVisibleFeeds() {
        this.shift += 1;

        if (this.activeFeedIndex < this.shift) {
            this.showFeed(this.activeFeedIndex + 1);
        }

        if (this.animatingRight) {
            const hasNewEntries = this.feeds.slice(this.shift + this.VISIBLE_FEED_COUNT)
                .some(({ newEntryCount }) => newEntryCount > 0);

            if (!hasNewEntries) {
                this.animatingRight = false;
            }
        }
    }

    setShift(index = 0) {
        this.shift = index >= this.VISIBLE_FEED_COUNT ? index - (this.VISIBLE_FEED_COUNT - 1) : 0;
    }

    resetScrollPosition() {
        const container = this.feedEntryContainer;

        if (container) {
            container.nativeElement.scrollTop = 0;
        }
    }

    removeFeed(index, noSave = false) {
        this.feeds.splice(index, 1);

        if (this.feeds.length) {
            this.setShift();
            this.showFeed();
        }
        else {
            this.activeFeed = null;
            this.showForm();
            clearTimeout(this.timeout);
        }

        if (!noSave) {
            this.saveFeeds();
        }
    }

    showForm(showButton = false) {
        this.showingForm = true;
        this.hideFeedList();
        this.showingFormCloseButton = showButton;
    }

    backToFeedList() {
        this.hideForm();
        this.showFeedList();
    }

    hideForm() {
        this.showingForm = false;
    }

    showFeedList() {
        this.showingFeedList = true;
        this.animatingLeft = false;
        this.animatingRight = false;
    }

    hideFeedList() {
        this.showingFeedList = false;
    }

    async getInitialFeeds(feedsToLoad) {
        const promises = feedsToLoad.map(feed => this.feedService.getFeed(feed.url, feed.title));
        const feeds = [];
        const failedToFetchFeeds = [];

        try {
            const results: any = await Promise.allSettled(promises);

            for (const [index, { status, value }] of results.entries()) {
                if (status === "fulfilled") {
                    feeds.push(value);
                }
                else {
                    failedToFetchFeeds.push({
                        ...feedsToLoad[index],
                        index
                    });
                }
            }
        } catch (e) {
            console.log(e);
        }
        return { feeds, failedToFetchFeeds };
    }

    async loadFeeds(feedsToLoad) {
        if (feedsToLoad.length) {
            const { feeds, failedToFetchFeeds } = await this.getInitialFeeds(feedsToLoad);

            this.feeds = feeds;
            this.feedsToLoad = failedToFetchFeeds;

            if (feeds.length) {
                this.showFeed();
            }
            else if (failedToFetchFeeds.length) {
                this.showFeedList();
            }
            else {
                this.showForm();
            }
            this.scheduleFeedUpdate();
        }
        else {
            this.showForm();
        }
        this.initializing = false;
    }

    scheduleFeedUpdate() {
        clearTimeout(this.timeout);
        this.timeout = window.setTimeout(() => {
            this.updateFeeds();
            this.scheduleFeedUpdate();
        }, 1500000);
    }

    async updateFeeds() {
        for (const [index, feed] of this.feeds.entries()) {
            await this.updateFeed(feed, index);
        }

        for (const feed of this.feedsToLoad) {
            await this.fetchFeed(feed);
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

    async updateFeed(feed, index) {
        try {
            const newFeed = await this.feedService.updateFeed(feed);

            if (!newFeed) {
                return;
            }
            const { length } = newFeed.entries;

            if (length) {
                feed.newEntryCount += length;
                this.newEntryCount += length;
                feed.entries = newFeed.entries.concat(feed.entries);
                this.animateShiftButton(index);
            }

            if (newFeed.updated) {
                feed.updated = newFeed.updated;
            }
        } catch (e) {
            console.log(e);
        }
    }

    animateShiftButton(index) {
        if (this.showingFeedList || this.showingForm) {
            return;
        }

        if (index >= this.shift + this.VISIBLE_FEED_COUNT) {
            this.animatingRight = true;
        }
        else if (index < this.shift) {
            this.animatingLeft = true;
        }
    }

    showFormMessage(message) {
        this.message = message;

        setTimeout(() => {
            this.message = "";
        }, 4000);
    }

    async handleFormSubmit(event) {
        const { elements } = event.target;
        const title = elements.title.value;
        const url = elements.url.value;

        event.preventDefault();

        if (this.feeds.some(feed => feed.url === url)) {
            this.showFormMessage("Feed already exists");
            return;
        }
        this.fetching = true;

        try {
            const index = this.feeds.length;

            await this.fetchFeed({ url, title });
            this.setShift(index);
            this.showFeed(index);
            this.hideForm();
            this.saveFeeds();
            this.scheduleFeedUpdate();
            event.target.reset();
        }
        catch (e) {
            this.showFormMessage(e.message);
            console.log(e);
        }
        finally {
            this.fetching = false;
        }
    }

    async fetchFeed({ url, title, index = this.feeds.length }) {
        const feed = await this.feedService.getFeed(url, title);
        this.feedsToLoad = this.feedsToLoad.filter(feed => feed.url !== url);

        this.feeds.splice(index, 0, feed);
    }

    async refetchFeed(feed) {
        feed.refeching = true;

        try {
            const index = Math.min(feed.index, this.feeds.length);

            await this.fetchFeed(feed);
            this.setShift(index);
            this.showFeed(index);
            this.hideFeedList();
            this.saveFeeds();
            this.scheduleFeedUpdate();
        } catch (e) {
            console.log(e);
        } finally {
            feed.refeching = false;
        }
    }

    removeFailedToFetchFeed(index) {
        this.feedsToLoad.splice(index, 1);
        this.saveFeeds();
    }

    handleHeaderItemClick({ target }, feed, index) {
        if (target.closest("[data-entry-count]")) {
            this.markEntriesAsRead(feed);
        }
        else {
            this.showFeed(index);
        }
    }

    showFeedFromList(index) {
        this.setShift(index);
        this.showFeed(index);
        this.hideFeedList();
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

    expandEntry(entry) {
        entry.truncated = false;
    }

    enableTitleEdit(feed) {
        feed.makingTitleEdit = true;

        setTimeout(() => {
            this.feedTitleInput.nativeElement.focus();
        });
    }

    editTitle(feed) {
        const title = this.feedTitleInput.nativeElement.value || feed.title;
        delete feed.makingTitleEdit;

        if (title !== feed.title) {
            feed.title = title;
            this.saveFeeds();
        }
    }

    saveFeeds() {
        const feeds = this.feeds.concat(this.feedsToLoad)
            .map(({ url, title }) => ({ url, title }));

        this.chromeStorageService.set({ feeds });
    }

    handleFeedDrop({ currentIndex, previousIndex }) {
        moveItemInArray(this.feeds, previousIndex, currentIndex);
        this.setShift();
        this.showFeed();
        this.saveFeeds();
    }
}
