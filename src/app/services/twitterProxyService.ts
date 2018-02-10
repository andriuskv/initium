export class TwitterProxyService {
    requestToken: string = "";
    requestTokenSecret: string = "";
    proxyUrl: string = process.env.PROXY_URL;
    oauth: any = JSON.parse(localStorage.getItem("oauth")) || {};

    isLoggedIn() {
        return this.oauth.token && this.oauth.tokenSecret;
    }

    async getLoginUrl() {
        const response = await fetch(`${this.proxyUrl}/request_token`).then(response => response.json());

        if (response.statusCode === 200) {
            this.requestToken = response.data.token;
            this.requestTokenSecret = response.data.tokenSecret;

            return {
                statusCode: response.statusCode,
                url: response.data.url
            };
        }
    }

    async getAccessToken(pinCode) {
        const response = await fetch(`${this.proxyUrl}/access_token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                pinCode,
                token: this.requestToken,
                tokenSecret: this.requestTokenSecret
            })
        }).then(response => response.json());

        if (response.statusCode === 200) {
            this.oauth = response.data;
            localStorage.setItem("oauth", JSON.stringify(response.data));
        }
        return {
            statusCode: response.statusCode
        };
    }

    getUser() {
        return fetch(`${this.proxyUrl}/user`, {
            method: "GET",
            headers: this.getAuthorizationHeaders()
        }).then(response => response.json());
    }

    getTimeline(params = {}) {
        return fetch(`${this.proxyUrl}/timeline${this.buildParams(params)}`, {
            method: "GET",
            headers: this.getAuthorizationHeaders()
        }).then(response => response.json());
    }

    getAuthorizationHeaders() {
        return {
            "x-authorization": `OAuth oauth_token=${this.oauth.token} oauth_token_secret=${this.oauth.tokenSecret}`
        };
    }

    buildParams(params) {
        const arr = Object.keys(params);

        if (!arr.length) {
            return "";
        }
        return "?" + arr.map(param => `${param}=${params[param]}`).join("&");
    }
}
