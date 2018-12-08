import { Component, Output, EventEmitter, Input, ViewChild } from "@angular/core";
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
    @ViewChild("feedTitleInput") feedTitleInput;
    @ViewChild("feedEntryContainer") feedEntryContainer;

    initializing: boolean = true;
    fetching: boolean = false;
    showingFeedList: boolean = false;
    showingForm: boolean = false;
    showingFormCloseButton: boolean = false;
    animatingRight: boolean = false;
    animatingLeft: boolean = false;
    VISIBLE_FEED_COUNT: number = 3;
    newEntryCount: number = 0;
    timeout: number = 0;
    initTimeout: number = 0;
    shift: number = 0;
    activeFeedIndex: number = 0;
    message: string = "";
    feedsToLoad: Array<any> = [];
    feeds: Array<any> = [];
    activeFeed: any = null;

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
        this.chromeStorageService.get(["feeds", "rss"], ({ feeds, rss }) => {
            if (rss) {
                this.feedsToLoad = rss;
                this.chromeStorageService.remove("rss");
                this.saveFeeds();
            }
            else {
                this.feedsToLoad = feeds || [];
            }
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

    removeFeed(index, isRemoveChange = false) {
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

        if (!isRemoveChange) {
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
        const feeds = [];
        const failedToFetchFeeds = [];

        for (const feed of feedsToLoad) {
            feed.status = "loading";

            try {
                const result = await this.feedService.getFeed(feed.url, feed.title);

                feed.status = "success";
                feeds.push(result);
            } catch (e) {
                feed.status = "error";
                failedToFetchFeeds.push(feed);
            } finally {
                setTimeout(() => {
                    feed.status = "finished";
                }, 1000);
            }
        }
        await delay(2000);

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
            const { length } = newFeed.entries;

            if (length) {
                feed.newEntryCount += length;
                this.newEntryCount += length;
                feed.entries = newFeed.entries.concat(feed.entries);
                this.animateShiftButton(index);
            }
            feed.updated = newFeed.updated;
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
            const feed = await this.feedService.getFeed(url, title);
            const index = this.feeds.length;

            this.feedsToLoad = this.feedsToLoad.filter(feed => feed.url !== url);
            this.feeds.push(feed);
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

    async refetchFeed(feed, index) {
        feed.refeching = true;

        try {
            const newFeed = await this.feedService.getFeed(feed.url, feed.title);
            const newFeedIndex = this.feeds.length;

            this.feeds.push(newFeed);
            this.feedsToLoad.splice(index, 1);
            this.setShift(newFeedIndex);
            this.showFeed(newFeedIndex);
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
        const oldTitle = feed.title;

        feed.makingTitleEdit = false;
        feed.title = this.feedTitleInput.nativeElement.value || oldTitle;

        if (feed.title !== oldTitle) {
            this.saveFeeds();
        }
    }

    saveFeeds() {
        const feeds = this.feeds.concat(this.feedsToLoad)
            .map(({ url, title }) => ({ url, title }));

        this.chromeStorageService.set({ feeds });
    }
}
