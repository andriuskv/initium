import { Component, Output, EventEmitter, Input } from "@angular/core";
import { TwitterService } from "../../services/twitterService";
import { TimeDateService } from "../../services/timeDateService";
import { NotificationService } from "../../services/notificationService";
import { formatTime } from "app/utils/utils";

@Component({
    selector: "twitter",
    templateUrl: "./twitter.html",
    styleUrls: ["./twitter.scss"]
})
export class Twitter {
    @Output() newTweets = new EventEmitter();
    @Output() toggleTab = new EventEmitter();
    @Output() showViewer = new EventEmitter();
    @Input() isVisible = false;

    initializing = true;
    isLoggedIn = false;
    showPinInput = false;
    fetchingMoreTweets = false;
    message = "";
    tweets = [];
    tweetsToLoad = [];
    user: any = {};
    initTimeout = 0;
    tweetTimeTimeout = 0;
    tweetUpdateTimeout = 0;

    constructor(
        private twitterService: TwitterService,
        private timeDateService: TimeDateService,
        private notificationService: NotificationService
    ) {}

    ngOnInit() {
        this.isLoggedIn = this.twitterService.isLoggedIn();

        if (this.isLoggedIn) {
            this.initTimeout = window.setTimeout(() => {
                this.initTimeout = 0;
                this.initTwitter();
            }, this.isVisible ? 2000 : 10000);
        }
        else {
            this.initializing = false;
        }
    }

    ngOnChanges() {
        if (this.initTimeout && this.isVisible) {
            clearTimeout(this.initTimeout);
            this.initTimeout = 0;
            this.initTwitter();
        }
    }

    initTwitter() {
        return Promise.all([this.getUser(), this.fetchInitialTimeline()])
            .then(() => {
                this.initializing = false;
            }).catch(error => {
                this.initializing = false;
                this.isLoggedIn = false;
                this.message = "Failed to fetch the content";

                window.setTimeout(() => {
                    this.message = "";
                }, 4000);
                console.log(error);
            });
    }

    getTweetDate(createdAt) {
        const date: any = new Date();
        const created: any = new Date(createdAt);
        const minuteDiff = Math.round((date - created) / 1000 / 60);
        let at = "";

        if (minuteDiff < 60) {
            at = `${minuteDiff}m`;
        }
        else if (minuteDiff <= 1440) {
            at = `${Math.round(minuteDiff / 60)}h`;
        }
        else if (minuteDiff <= 1500) {
            at = "1d";
        }
        else {
            const month = this.timeDateService.getMonth(created.getMonth(), true);
            at = `${month} ${created.getDate()}`;
        }
        return {
            createdAtDate: createdAt,
            at
        };
    }

    getTweetEnitity(entity) {
        return entity?.length ? entity : [];
    }

    getTweetEntities(entities) {
        return {
            hashtags: this.getTweetEnitity(entities.hashtags),
            userMentions: this.getTweetEnitity(entities.user_mentions),
            urls: this.getTweetEnitity(entities.urls),
            media: this.getTweetEnitity(entities.media)
        };
    }

    replaceUserMentions(text, userMentions) {
        userMentions.forEach(user => {
            const screenNameRegex = new RegExp(`[@＠]${user.screen_name}\\b`, "gi");
            const mention = text.match(screenNameRegex)[0];
            const mentionRegex = new RegExp(`${mention}\\b`, "g");
            const href = `https://twitter.com/${user.screen_name}`;
            const a = `<a href="${href}" class="tweet-link" target="_blank">${mention}</a>`;

            text = text.replace(mentionRegex, a);
        });
        return text;
    }

    replaceHashtags(text, hashtags) {
        hashtags.forEach(({ text: hashtag }) => {
            const regex = new RegExp(`#${hashtag}\\b`, "g");
            const href = `https://twitter.com/hashtag/${hashtag}?src=hash`;
            const a = `<a href="${href}" class="tweet-link" target="_blank">#${hashtag}</a>`;

            text = text.replace(regex, a);
        });
        return text;
    }

    replaceUrls(text, urls) {
        urls.filter(({ url }, index) => {
            return index === urls.findIndex(obj => obj.url === url);
        }).forEach(({ url, display_url }) => {
            const regex = new RegExp(url, "g");
            const a = `<a href="${url}" class="tweet-link" target="_blank">${display_url}</a>`;

            text = text.replace(regex, a);
        });
        return text;
    }

    replaceTweetEntities(text, entities) {
        if (entities.userMentions.length) {
            text = this.replaceUserMentions(text, entities.userMentions);
        }

        if (entities.hashtags.length) {
            text = this.replaceHashtags(text, entities.hashtags);
        }

        if (entities.urls.length) {
            text = this.replaceUrls(text, entities.urls);
        }

        if (entities.media.length) {
            text = text.replace(entities.media[0].url, "").trim();
        }

        return text;
    }

    getMedia(media) {
        return media.map(item => {
            if (item.type === "animated_gif") {
                return {
                    type: "gif",
                    thumbUrl: item.media_url_https,
                    url: item.video_info.variants[0].url
                };
            }

            if (item.type === "video") {
                const durationInSeconds = Math.round(item.video_info.duration_millis / 1000);
                const duration = this.formatDuration(durationInSeconds);

                return {
                    duration,
                    durationInSeconds,
                    type: item.type,
                    thumbUrl: item.media_url_https,
                    url: item.video_info.variants.find(variant => variant.content_type === "video/mp4").url
                };
            }
            return {
                type: item.type,
                url: item.media_url_https,
                smallestDimension: this.getSmallestDimension(item.sizes.medium)
            };
        });
    }

    formatDuration(seconds) {
        if (!seconds) {
            return "";
        }
        return formatTime(seconds);
    }

    getSmallestDimension({ w, h }) {
        return w >= h ? "height" : "width";
    }

    getTweetContent(tweet) {
        const screenName = tweet.user.screen_name;
        const userUrl = `https://twitter.com/${screenName}`;
        const media = tweet.extended_entities && tweet.extended_entities.media;
        const entities = this.getTweetEntities(Object.assign(tweet.entities, { media }));

        return {
            userUrl,
            id: tweet.id,
            name: tweet.user.name,
            handle: `@${screenName}`,
            tweetUrl: `${userUrl}/status/${tweet.id_str}`,
            profileImg: tweet.user.profile_image_url_https,
            text: this.replaceTweetEntities(tweet.full_text, entities),
            created: this.getTweetDate(tweet.created_at),
            media: this.getMedia(entities.media),
            retweetCount: this.formatCounter(tweet.retweet_count),
            likeCount: this.formatCounter(tweet.favorite_count),
            retweetedBy: null
        };
    }

    roundTo(number, places) {
        return Number(Math.round((number + "e" + places) as any) + "e-" + places);
    }

    formatCounter(value) {
        if (value < 1000) {
            return value;
        }
        let divisor = 1e3;
        let symbol = "K";

        if (value >= 1e6) {
            divisor = 1e6;
            symbol = "M";
        }
        const roundedValue = this.roundTo(value / divisor, 1).toFixed(1);

        return roundedValue + symbol;
    }

    isInsideLinkElement(element) {
        while (element) {
            if (element.nodeName === "A") {
                return true;
            }
            element = element.parentElement;
        }
        return false;
    }

    handleClickOnTweet({ target }, url) {
        if (!window.getSelection().isCollapsed || this.isInsideLinkElement(target)) {
            return;
        }
        window.open(url, "_blank");
    }

    handleImageClick(event, media, index) {
        event.stopPropagation();

        this.showViewer.emit({
            images: [].concat(media),
            startIndex: index
        });
    }

    handleVideoClick(event, media) {
        const video = event.currentTarget.firstElementChild;

        event.preventDefault();
        event.stopPropagation();
        media.active = true;

        if (video.paused) {
            video.play();
        }
        else {
            video.pause();
        }
    }

    loadNewTweets() {
        const tweets = this.parseTweets(this.tweetsToLoad);

        this.tweets.unshift(...tweets);
        this.tweetsToLoad.length = 0;
    }

    parseTweets(data) {
        return data.map(tweet => {
            const retweet = tweet.retweeted_status;

            if (retweet) {
                const newTweet = this.getTweetContent(retweet);

                newTweet.id = tweet.id;
                newTweet.retweetedBy = {
                    name: tweet.user.name,
                    userUrl: `https://twitter.com/${tweet.user.screen_name}`
                };
                return newTweet;
            }
            return this.getTweetContent(tweet);
        });
    }

    async getUser() {
        const response = await this.twitterService.getUser();

        if (response?.user) {
            const { user } = response;
            this.user.name = user.name;
            this.user.homepage = `https://twitter.com/${user.screen_name}`;
            this.user.handle = `@${user.screen_name}`;
            this.user.profileImage = user.profile_image_url_https;
            this.user.profileColor = `#${user.profile_link_color}`;
        }
    }

    async fetchInitialTimeline() {
        const response = await this.twitterService.getTimeline();

        if (response?.tweets) {
            const { tweets } = response;
            this.tweets = this.parseTweets(tweets);

            this.scheduleTimelineUpdate(tweets[tweets.length - 1].id);
            this.updateTweetTime();
        }
    }

    scheduleTimelineUpdate(tweetId) {
        this.tweetUpdateTimeout = window.setTimeout(() => {
            this.fetchNewTimeline(tweetId);
        }, 960000);
    }

    updateTweetTime() {
        this.tweetTimeTimeout = window.setTimeout(() => {
            this.tweets.forEach(tweet => {
                tweet.created = this.getTweetDate(tweet.created.createdAtDate);
            });
            this.updateTweetTime();
        }, 60000);
    }

    updateTweetCounters(tweet, newTweet) {
        let { retweeted_status, retweet_count, favorite_count } = newTweet;

        if (retweeted_status) {
            ({ retweet_count, favorite_count } = retweeted_status);
        }
        tweet.retweetCount = this.formatCounter(retweet_count);
        tweet.likeCount = this.formatCounter(favorite_count);
    }

    async fetchNewTimeline(tweetId) {
        const response = await this.twitterService.getTimeline({ since_id: tweetId });

        if (response?.tweets.length) {
            const { tweets } = response;
            const currentTweets = this.tweetsToLoad.concat(this.tweets);
            const newTweets = [];
            tweetId = tweets[tweets.length - 1].id;

            for (const tweet of tweets) {
                const foundTweet = currentTweets.find(({ id }) => tweet.id === id);

                if (foundTweet) {
                    this.updateTweetCounters(foundTweet, tweet);
                }
                else {
                    newTweets.push(tweet);
                }
            }
            this.tweetsToLoad.unshift(...newTweets);

            if (newTweets.length && !this.isVisible) {
                this.newTweets.emit();
            }

            if (document.hidden) {
                this.notificationService.send(
                    "Twitter",
                    `You have ${this.tweetsToLoad.length} new tweets`,
                    () => this.toggleTab.emit("twitter")
                );
            }
        }
        this.scheduleTimelineUpdate(tweetId);
    }

    async fetchMoreTweets() {
        if (this.fetchingMoreTweets) {
            return;
        }
        this.fetchingMoreTweets = true;

        const { id } = this.tweets[this.tweets.length - 1];
        const response = await this.twitterService.getTimeline({
            max_id: id
        });

        if (!response || !response.tweets) {
            this.fetchingMoreTweets = false;
            return;
        }
        const tweets = response.tweets.filter(tweet => tweet.id !== id);

        if (tweets.length) {
            const newTweets = this.parseTweets(tweets);

            this.tweets.push(...newTweets);
        }
        this.fetchingMoreTweets = false;
    }

    async authenticateWithPin(pin) {
        this.initializing = true;
        this.showPinInput = false;

        const response = await this.twitterService.getAccessToken(pin.value);

        if (response) {
            this.isLoggedIn = true;
            pin.value = "";

            this.initTwitter();
        }
        else {
            this.showPinInput = true;
            this.initializing = false;
        }
    }

    async login(pin) {
        if (pin.value) {
            this.authenticateWithPin(pin);
            return;
        }
        const url = await this.twitterService.getLoginUrl();

        if (url) {
            this.showPinInput = true;
            window.open(url, "_blank", "width=640,height=480");
        }
    }

    logout() {
        clearTimeout(this.initTimeout);
        clearTimeout(this.tweetTimeTimeout);
        clearTimeout(this.tweetUpdateTimeout);
        localStorage.removeItem("oauth");
        this.isLoggedIn = false;
        this.user = {};
        this.tweets.length = 0;
        this.tweetsToLoad.length = 0;
    }
}
