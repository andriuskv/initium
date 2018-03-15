import { Component, Output, EventEmitter, Input } from "@angular/core";
import { TwitterProxyService } from "../../services/twitterProxyService";
import { TimeDateService } from "../../services/timeDateService";
import { NotificationService } from "../../services/notificationService";

@Component({
    selector: "twitter",
    templateUrl: "./twitter.html"
})
export class Twitter {
    @Output() newTweets = new EventEmitter();
    @Output() toggleTab = new EventEmitter();
    @Output() toggleSize = new EventEmitter();
    @Output() showViewer = new EventEmitter();
    @Input() isVisible: boolean = false;

    initializing: boolean = true;
    isLoggedIn: boolean = false;
    showPinInput: boolean = false;
    fetchingMoreTweets: boolean = false;
    isExpanded: boolean = false;
    tweets: Array<any> = [];
    tweetsToLoad: Array<any> = [];
    user: any = {};
    initTimeout: number = 0;
    tweetTimeTimeout: number = 0;
    tweetUpdateTimeout: number = 0;

    constructor(
        private twitterProxyService: TwitterProxyService,
        private timeDateService: TimeDateService,
        private notificationService: NotificationService
    ) {
        this.twitterProxyService = twitterProxyService;
        this.timeDateService = timeDateService;
        this.notificationService = notificationService;
    }

    ngOnInit() {
        this.isLoggedIn = this.twitterProxyService.isLoggedIn();

        if (this.isLoggedIn) {
            this.initTimeout = window.setTimeout(async () => {
                this.initTimeout = 0;

                await this.initTwitter();

                this.initializing = false;
            }, this.isVisible ? 2000 : 10000);
            return;
        }
        this.initializing = false;
    }

    async ngOnChanges() {
        this.isExpanded = this.isVisible && this.isExpanded;

        if (this.initTimeout && this.isVisible) {
            clearTimeout(this.initTimeout);
            this.initTimeout = 0;

            await this.initTwitter();

            this.initializing = false;
        }
    }

    initTwitter() {
        return Promise.all([this.getUser(), this.fetchInitialTimeline()])
            .catch(error => console.log(error));
    }

    getTweetDate(createdAt) {
        const date: any = new Date();
        const created: any = new Date(createdAt);
        const minuteDiff = Math.round((date - created) / 1000 / 60);
        let at = "";

        if (minuteDiff <= 60) {
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
        return entity && entity.length ? entity : [];
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
        })
        .forEach(({ url, display_url }) => {
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
            const wordArray = text.split(" ");

            wordArray.splice(wordArray.indexOf(entities.media[0].url));
            text = wordArray.join(" ");
        }

        return text;
    }

    getMedia(media) {
        if (!media.length) {
            return;
        }
        return media.map(item => {
            if (item.type === "animated_gif") {
                return {
                    type: "gif",
                    thumbUrl: item.media_url_https,
                    url: item.video_info.variants[0].url
                };
            }

            if (item.type === "video") {
                return {
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
            text: this.replaceTweetEntities(tweet.text, entities),
            created: this.getTweetDate(tweet.created_at),
            media: this.getMedia(entities.media),
            retweetCount: tweet.retweet_count,
            likeCount: tweet.favorite_count,
            retweetedBy: null
        };
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
        if (this.isInsideLinkElement(target)) {
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
        const response = await this.twitterProxyService.getUser();

        if (response.statusCode === 200) {
            this.user.name = response.user.name;
            this.user.homepage = `https://twitter.com/${response.user.screen_name}`;
            this.user.handle = `@${response.user.screen_name}`;
            this.user.profileImage = response.user.profile_image_url_https;
        }
    }

    async fetchInitialTimeline() {
        const response = await this.twitterProxyService.getTimeline();

        if (response && response.statusCode === 200) {
            this.tweets = this.parseTweets(response.tweets);

            this.updateTimeline(response.tweets[0].id);
            this.updateTweetTime();
        }
    }

    updateTimeline(latestTweetId) {
        this.tweetUpdateTimeout = window.setTimeout(() => {
            this.fetchNewTimeline(latestTweetId);
        }, 720000);
    }

    updateTweetTime() {
        this.tweetTimeTimeout = window.setTimeout(() => {
            this.tweets.forEach(tweet => {
                tweet.created = this.getTweetDate(tweet.created.createdAtDate);
            });
            this.updateTweetTime();
        }, 60000);
    }

    async fetchNewTimeline(latestTweetId) {
        const response = await this.twitterProxyService.getTimeline({
            since_id: latestTweetId
        });

        if (!response || response.statusCode !== 200) {
            this.updateTimeline(latestTweetId);
            return;
        }
        const tweets = response.tweets.filter(tweet => tweet.id !== latestTweetId);

        if (tweets.length) {
            latestTweetId = tweets[0].id;

            this.tweetsToLoad.unshift(...tweets);

            if (!this.isVisible) {
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
        this.updateTimeline(latestTweetId);
    }

    async fetchMoreTweets() {
        if (this.fetchingMoreTweets) {
            return;
        }
        this.fetchingMoreTweets = true;

        const { id } = this.tweets[this.tweets.length - 1];
        const response = await this.twitterProxyService.getTimeline({
            max_id: id
        });

        if (!response || response.statusCode !== 200) {
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

        const response = await this.twitterProxyService.getAccessToken(pin.value);

        if (response && response.statusCode === 200) {
            this.isLoggedIn = true;
            pin.value = "";

            await this.initTwitter();
        }
        else {
            this.showPinInput = true;
        }
        this.initializing = false;
    }

    async login(pin) {
        if (pin.value) {
            this.authenticateWithPin(pin);
            return;
        }
        const response = await this.twitterProxyService.getLoginUrl();

        if (response && response.statusCode === 200) {
            this.showPinInput = true;
            window.open(response.url, "_blank", "width=640,height=480");
        }
    }

    logout() {
        clearTimeout(this.initTimeout);
        clearTimeout(this.tweetTimeTimeout);
        clearTimeout(this.tweetUpdateTimeout);
        localStorage.removeItem("oauth");
        this.isLoggedIn = false;
        this.tweets.length = 0;
        this.tweetsToLoad.length = 0;

        if (this.isExpanded) {
            this.toggleContainerSize();
        }
    }

    toggleContainerSize() {
        this.isExpanded = !this.isExpanded;
        this.toggleSize.emit(this.isExpanded);
    }
}
