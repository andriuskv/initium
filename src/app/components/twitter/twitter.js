/* global Codebird */

import { Component, Output, EventEmitter, Input } from "@angular/core";
import { DateService } from "services/dateService";
import { NotificationService } from "services/notificationService";

@Component({
    selector: "twitter",
    templateUrl: "app/components/twitter/twitter.html"
})
export class Twitter {
    @Output() newTweetCount = new EventEmitter();
    @Output() toggleTab = new EventEmitter();
    @Input() item;

    static get parameters() {
        return [[DateService], [NotificationService]];
    }

    constructor(dateService, notificationService) {
        this.dateService = dateService;
        this.notification = notificationService;
        this.user = {};
        this.tweets = [];
        this.tweetsToLoad = [];
        this.twitterTimeout = 0;
        this.tweetTimeTimeout = 0;
        this.tweetUpdateTimeout = 0;
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

        script.setAttribute("src", "js/libs/codebird.js");
        document.getElementsByTagName("body")[0].appendChild(script);
        script.addEventListener("load", () => {
            if (this.isAuthenticated()) {
                if (this.isActive) {
                    setTimeout(() => {
                        this.fetchTweets();
                    }, 2000);
                }
                else {
                    this.twitterTimeout = setTimeout(() => {
                        this.fetchTweets();
                    }, 10000);
                }
            }
        }, false);
    }

    setKey(ref) {
        ref.setConsumerKey("", "");
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
        const date = new Date();
        const created = new Date(createdAt);
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
        userMentions.forEach(mention => {
            const name = text.includes(`@${mention.name}`) ? mention.name : mention.screen_name;
            const href = `https://twitter.com/${mention.screen_name}`;
            const a = `
                <a href="${href}" class="twitter-tweet-link" target="_blank">@${name}</a>
            `;

            text = text.replace(`@${name}`, a);
        });
        return text;
    }

    replaceHashtags(text, hashtags) {
        hashtags.forEach(({ text: hashtag }) => {
            const href = `https://twitter.com/hashtag/${hashtag}?src=hash`;
            const a = `
                <a href="${href}" class="twitter-tweet-link" target="_blank">#${hashtag}</a>
            `;

            text = text.replace(`#${hashtag}`, a);
        });
        return text;
    }

    replaceUrls(text, urls) {
        urls.forEach(({ url, display_url }) => {
            const a = `
                <a href="${url}" class="twitter-tweet-link" target="_blank">${display_url}</a>
            `;

            text = text.replace(url, a);
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
            return media[0].media_url_https;
        }
    }

    getTweetContent(tweet) {
        const screenName = tweet.user.screen_name;
        const userUrl = `https://twitter.com/${screenName}`;
        const entities = this.getTweetEntities(tweet.entities);

        return {
            userUrl,
            id: tweet.id,
            name: tweet.user.name,
            handle: `@${screenName}`,
            tweetUrl: `${userUrl}/status/${tweet.id_str}`,
            profileImg: tweet.user.profile_image_url_https,
            text: this.replaceTweetEntities(tweet.text, entities),
            created: this.getTweetDate(tweet.created_at),
            media: this.getMediaUrl(entities.media)
        };
    }

    loadNewTweets() {
        const newTweets = this.loadTweets(this.tweetsToLoad);

        this.tweets.unshift(...newTweets);
        this.tweetsToLoad.length = 0;
        this.newTweetCount.emit(0);
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
        this.tweetUpdateTimeout = setTimeout(() => {
            const cb = new Codebird;

            this.setInfo(cb, userInfo);
            cb.__call("statuses_homeTimeline", `since_id=${latestTweetId}`, tweets => {
                if (tweets && tweets.length) {
                    const newTweets = tweets.filter(tweet => tweet.id !== latestTweetId);

                    if (newTweets.length) {
                        clearTimeout(this.tweetUpdateTimeout);
                        this.tweetsToLoad.unshift(...newTweets);
                        this.updateTimeline(userInfo, newTweets[0].id);

                        if (!this.isActive) {
                            this.newTweetCount.emit(this.tweetsToLoad.length);
                        }
                        this.notification.send(
                            "Twitter",
                            `You have ${this.tweetsToLoad.length} new tweets.`
                        ).then(disabled => {
                            if (!disabled) {
                                this.toggleTab.emit("twitter");
                            }
                        });
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

    removeLeftoverImages() {
        const imageElems = [...document.querySelectorAll(".twitter-tweet-img")];

        imageElems.forEach(image => {
            image.parentElement.removeChild(image);
        });
    }

    logout() {
        clearTimeout(this.twitterTimeout);
        clearTimeout(this.tweetTimeTimeout);
        clearTimeout(this.tweetUpdateTimeout);
        localStorage.removeItem("userInfo");
        this.removeLeftoverImages();
        this.isLoggedIn = false;
        this.tweets.length = 0;
        this.tweetsToLoad.length = 0;
    }

    fetchMoreTweets() {
        const userInfo = JSON.parse(localStorage.getItem("userInfo")) || {};
        const oldestTweet = this.tweets[this.tweets.length - 1];
        const cb = new Codebird;

        if (userInfo.token && userInfo.tokenSecret) {
            this.setInfo(cb, userInfo);
            cb.__call("statuses_homeTimeline", `max_id=${oldestTweet.id}`, tweets => {
                tweets = tweets.filter(tweet => tweet.id !== oldestTweet.id);

                if (tweets.length) {
                    const newTweets = this.loadTweets(tweets);

                    this.tweets.push(...newTweets);
                }
            });
        }
    }
}
