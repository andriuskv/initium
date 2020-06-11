import { Injectable } from "@angular/core";

@Injectable({
    providedIn: "root"
})
export class TwitterService {
    requestToken = "";
    requestTokenSecret = "";
    serverUrl = `${process.env.SERVER_URL}/twitter`;
    oauth: any = JSON.parse(localStorage.getItem("oauth")) || {};

    isLoggedIn() {
        return this.oauth.token && this.oauth.tokenSecret;
    }

    getLoginUrl(retry = true) {
        return fetch(`${this.serverUrl}/request_token`)
            .then(response => response.json())
            .then(json => {
                if (json.token) {
                    this.requestToken = json.token;
                    this.requestTokenSecret = json.tokenSecret;

                    return json.url;
                }
            })
            .catch(error => {
                console.log(error);

                if (retry) {
                    return this.getLoginUrl(false);
                }
            });
    }

    getAccessToken(pinCode, retry = true) {
        return fetch(`${this.serverUrl}/access_token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                pinCode,
                token: this.requestToken,
                tokenSecret: this.requestTokenSecret
            })
        })
        .then(response => response.json())
        .then(json => {
            if (json.token) {
                this.oauth = json;
                localStorage.setItem("oauth", JSON.stringify(json));

                return true;
            }
        })
        .catch(error => {
            console.log(error);

            if (retry) {
                return this.getAccessToken(pinCode, false);
            }
        });
    }

    getUser(retry = true) {
        return fetch(`${this.serverUrl}/user`, {
            method: "GET",
            headers: this.getAuthorizationHeaders()
        })
        .then(response => response.json())
        .catch(error => {
            console.log(error);

            if (retry) {
                return this.getUser(false);
            }
            throw new Error(error);
        });
    }

    getTimeline(params = {}, retry = true) {
        const url = this.buildURL(`${this.serverUrl}/timeline`, {
            count: 30,
            exclude_replies: true,
            tweet_mode: "extended",
            ...params
        });

        return fetch(url, {
            method: "GET",
            headers: this.getAuthorizationHeaders()
        })
        .then(response => response.json())
        .catch(error => {
            console.log(error);

            if (retry) {
                return this.getTimeline(params, false);
            }
            throw new Error(error);
        });
    }

    getAuthorizationHeaders() {
        return {
            "x-authorization": `OAuth oauth_token=${this.oauth.token} oauth_token_secret=${this.oauth.tokenSecret}`
        };
    }

    buildURL(urlString, params) {
        const url = new URL(urlString);

        for (const [key, value] of Object.entries(params)) {
            url.searchParams.set(key, (value as any));
        }
        return url.href;
    }
}
