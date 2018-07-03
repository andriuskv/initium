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

    initializing: boolean = true;
    loading: boolean = true;
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
        this.chromeStorageService.subscribeToChanges(({ rss}) => {
            if (rss) {
                this.loadFeeds(rss.newValue);
            }
        });
        this.chromeStorageService.get("rss", storage => {
            this.loading = false;
            this.feedsToLoad = storage.rss || [];
            this.loadFeeds(this.feedsToLoad);
        });
    }

    saveFeeds() {
        const feeds = this.feeds
            .map(({ url, title }) => ({ url, title }))
            .concat(this.feedsToLoad);

        this.chromeStorageService.set({ rss: feeds });
    }

    showFeed(index = 0) {
        this.activeFeedIndex = index;
        this.activeFeed = this.feeds[index];
    }

    previousVisibleFeeds() {
        this.shift -= 1;
        this.animatingLeft = false;

        if (this.activeFeedIndex >= this.shift + this.VISIBLE_FEED_COUNT) {
            this.showFeed(this.activeFeedIndex - 1);
        }
    }

    nextVisibleFeeds() {
        this.shift += 1;
        this.animatingRight = false;

        if (this.activeFeedIndex < this.shift) {
            this.showFeed(this.activeFeedIndex + 1);
        }
    }

    setShift(index = 0) {
        this.shift = index >= this.VISIBLE_FEED_COUNT ? index - 2 : 0;
    }

    removeFeed(index) {
        this.feeds.splice(index, 1);

        if (!this.feeds.length) {
            this.activeFeed = null;
            this.showForm();
            clearTimeout(this.timeout);
        }
        else {
            this.setShift();
            this.showFeed();
        }
        this.saveFeeds();
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

    getFeeds(feedsToLoad, failedToFetchFeeds) {
        return feedsToLoad.map(feed => {
            feed.isLoading = true;

            return this.feedService.getFeed(feed.url, feed.title).then(results => {
                feed.isLoading = false;
                feed.success = true;

                return results;
            })
            .catch(() => {
                feed.isLoading = false;
                feed.error = true;
                failedToFetchFeeds.push(feed);
            });
        });
    }

    async loadFeeds(feedsToLoad) {
        if (!feedsToLoad.length) {
            this.initializing = false;
            this.activeFeed = null;
            this.feeds.length = 0;
            this.showForm();
            return;
        }
        const failedToFetchFeeds = [];
        const feeds = await Promise.all(this.getFeeds(feedsToLoad, failedToFetchFeeds));
        await delay(1000);

        this.feeds = [...feeds].filter(feed => feed);
        this.feedsToLoad = failedToFetchFeeds;

        if (this.feeds.length) {
            this.showFeed();
        }
        else if (this.feedsToLoad.length) {
            this.showFeedList();
        }
        else {
            this.showForm();
        }
        this.initializing = false;
        this.scheduleFeedUpdate();
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

    async handleFormSubmit(event) {
        const { elements } = event.target;
        const title = elements.title.value;
        const url = elements.url.value;
        this.fetching = true;

        event.preventDefault();

        try {
            const feed = await this.feedService.getFeed(url, title);
            const index = this.feeds.length;

            this.feeds.push(feed);
            this.setShift(index);
            this.showFeed(index);
            this.hideForm();
            this.saveFeeds();
            this.scheduleFeedUpdate();
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
    }

    handleHeaderItemClick({ target }, feed, index) {
        if (target.classList.contains("feed-new-entry-count")) {
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

    enableTitleEdit(feed) {
        feed.editingTitle = true;

        setTimeout(() => {
            this.feedTitleInput.nativeElement.focus();
        });
    }

    editTitle(feed) {
        const oldTitle = feed.title;

        feed.editingTitle = false;
        feed.title = this.feedTitleInput.nativeElement.value || oldTitle;

        if (feed.title !== oldTitle) {
            this.saveFeeds();
        }
    }
}
