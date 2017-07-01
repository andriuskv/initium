/* global Codebird */

import { Component, Output, EventEmitter, Input } from "@angular/core";
import { DateService } from "../../services/dateService";
import { NotificationService } from "../../services/notificationService";

declare const Codebird;
declare const process;

@Component({
    selector: "twitter",
    templateUrl: "./twitter.html"
})
export class Twitter {
    @Output() newTweets = new EventEmitter();
    @Output() toggleTab = new EventEmitter();
    @Input() item;

    isLoggedIn: boolean;
    isActive: boolean;
    showPinInput: boolean;
    tweets: Array<any> = [];
    tweetsToLoad: Array<any> = [];
    user: any = {};
    twitterTimeout: any;
    tweetTimeTimeout: any;
    tweetUpdateTimeout: any;
    cb: any;

    constructor(private dateService: DateService, private notificationService: NotificationService) {
        this.dateService = dateService;
        this.notificationService = notificationService;
    }

    ngOnInit() {
        this.isLoggedIn = this.isAuthenticated();
        this.initTwitter();
    }

    ngOnChanges(changes) {
        this.isActive = changes.item.currentValue === "twitter";

        if (!this.twitterTimeout) {
            return;
        }

        if (this.isActive && !this.tweets.length && this.twitterTimeout.data.handleId > 0) {
            clearTimeout(this.twitterTimeout);
            this.fetchTweets();
        }
    }

    initTwitter() {
        const script = document.createElement("script");

        script.setAttribute("src", "libs/codebird.js");
        document.getElementsByTagName("body")[0].appendChild(script);
        script.addEventListener("load", () => {
            if (this.isAuthenticated()) {
                const delay = this.isActive ? 2000 : 10000;

                this.twitterTimeout = setTimeout(() => {
                    this.fetchTweets();
                }, delay);
            }
        }, false);
    }

    setKey(ref) {
        const keys = process.env.TWITTER_API_KEYS.split(" ");
        ref.setConsumerKey(keys[0], keys[1]);
    }

    setInfo(ref, info) {
        this.setKey(ref);
        ref.setToken(info.token, info.tokenSecret);
    }

    isAuthenticated() {
        const userInfo = JSON.parse(localStorage.getItem("userInfo")) || {};

        return userInfo.token && userInfo.tokenSecret;
    }

    getTweetDate(createdAt) {
        const date: any = new Date();
        const created: any = new Date(createdAt);
        let minuteDiff = (date - created) / 1000 / 60;
        let at = "";

        minuteDiff = Math.round(minuteDiff);
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
            const monthName = this.dateService.getMonth(created.getMonth());
            const monthNameShort = monthName.slice(0, 3);

            at = `${monthNameShort} ${created.getDate()}`;
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

    getMediaUrl(media) {
        if (media.length) {
            return media.map(item => {
                if (item.type === "animated_gif") {
                    return {
                        type: "gif",
                        thumbUrl: item.media_url_https,
                        url: item.video_info.variants[0].url
                    }
                }

                if (item.type === "video") {
                    return {
                        type: item.type,
                        thumbUrl: item.media_url_https,
                        url: item.video_info.variants.find(variant => variant.content_type === "video/mp4").url
                    }
                }
                return {
                    type: item.type,
                    url: item.media_url_https
                };
            });
        }
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
            media: this.getMediaUrl(entities.media),
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
        window.open(url,'_blank');
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
        const newTweets = this.loadTweets(this.tweetsToLoad);

        this.tweets.unshift(...newTweets);
        this.tweetsToLoad.length = 0;
    }

    updateTweetTime() {
        this.tweetTimeTimeout = setTimeout(() => {
            this.tweets.forEach(tweet => {
                tweet.created = this.getTweetDate(tweet.created.createdAtDate);
            });
            this.updateTweetTime();
        }, 60000);
    }

    updateTimeline(userInfo, latestTweetId) {
        clearTimeout(this.tweetUpdateTimeout);
        this.tweetUpdateTimeout = setTimeout(() => {
            const cb = new Codebird;

            this.setInfo(cb, userInfo);
            cb.__call("statuses_homeTimeline", `since_id=${latestTweetId}`, tweets => {
                if (tweets && tweets.length) {
                    const newTweets = tweets.filter(tweet => tweet.id !== latestTweetId);

                    if (newTweets.length) {
                        this.tweetsToLoad.unshift(...newTweets);
                        this.updateTimeline(userInfo, newTweets[0].id);

                        if (!this.isActive) {
                            this.newTweets.emit(true);
                        }
                        if (document.hidden) {
                            this.notificationService.send(
                                "Twitter",
                                `You have ${this.tweetsToLoad.length} new tweets`
                            ).then(disabled => {
                                if (!disabled) {
                                    this.toggleTab.emit("twitter");
                                }
                            });
                        }
                        return;
                    }
                }
                this.updateTimeline(userInfo, latestTweetId);
            });
        }, 240000);
    }

    loadTweets(data) {
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

    getUserInfo(userInfo) {
        const cb = new Codebird;

        this.setInfo(cb, userInfo);
        cb.__call("account_verifyCredentials", {}, user => {
            this.user.name = user.name;
            this.user.homepage = `https://twitter.com/${user.screen_name}`;
            this.user.handle = `@${user.screen_name}`;
            this.user.profileImage = user.profile_image_url_https;
        });
    }

    fetchTweets() {
        const userInfo = JSON.parse(localStorage.getItem("userInfo")) || {};

        if (userInfo.token && userInfo.tokenSecret) {
            const cb = new Codebird;

            this.setInfo(cb, userInfo);
            cb.__call("statuses_homeTimeline", {}, tweets => {
                this.tweets = this.loadTweets(tweets);
                this.updateTimeline(userInfo, tweets[0].id);
                this.updateTweetTime();
            });
            this.getUserInfo(userInfo);
        }
    }

    authenticateWithPin(pin) {
        this.cb.__call("oauth_accessToken", { oauth_verifier: pin.value }, reply => {
            if (reply.httpstatus === 200) {
                this.cb.setToken(reply.oauth_token, reply.oauth_token_secret);
                localStorage.setItem("userInfo", JSON.stringify({
                    userId: reply.user_id,
                    screenName: reply.screen_name,
                    token: reply.oauth_token,
                    tokenSecret: reply.oauth_token_secret
                }));
                this.isLoggedIn = true;
                this.showPinInput = false;
                this.fetchTweets();
            }
            pin.value = "";
        });
    }

    login(event, pin) {
        if (event.which === 1 || event.which === 13) {
            if (pin.value) {
                this.authenticateWithPin(pin);
                return;
            }
            this.cb = new Codebird;
            this.setKey(this.cb);
            this.cb.__call("oauth_requestToken", { oauth_callback: "oob" }, (reply, rate, err) => {
                if (err) {
                    console.log("error response or timeout exceeded", err.error);
                }
                if (reply.httpstatus !== 401) {
                    this.cb.setToken(reply.oauth_token, reply.oauth_token_secret);
                    this.cb.__call("oauth_authorize", {}, url => {
                        this.showPinInput = true;
                        window.open(url, "_blank", "width=640,height=480");
                    });
                }
            });
        }
    }

    logout() {
        clearTimeout(this.twitterTimeout);
        clearTimeout(this.tweetTimeTimeout);
        clearTimeout(this.tweetUpdateTimeout);
        localStorage.removeItem("userInfo");
        this.isLoggedIn = false;
        this.tweets.length = 0;
        this.tweetsToLoad.length = 0;
    }

    fetchMoreTweets() {
        const userInfo = JSON.parse(localStorage.getItem("userInfo")) || {};
        const { id: oldestTweetId } = this.tweets[this.tweets.length - 1];
        const cb = new Codebird;

        if (userInfo.token && userInfo.tokenSecret) {
            this.setInfo(cb, userInfo);
            cb.__call("statuses_homeTimeline", `max_id=${oldestTweetId}`, tweets => {
                tweets = tweets.filter(tweet => tweet.id !== oldestTweetId);

                if (tweets.length) {
                    const newTweets = this.loadTweets(tweets);

                    this.tweets.push(...newTweets);
                }
            });
        }
    }
}
