import { getMonth } from "./timeDate";

const serverUrl = `${process.env.SERVER_URL}/twitter`;
let oauth = JSON.parse(localStorage.getItem("oauth")) || {};
let requestToken = "";
let requestTokenSecret = "";

function isLoggedIn() {
  return oauth.token && oauth.tokenSecret;
}

async function fetchLoginUrl() {
  const json = await fetch(`${serverUrl}/request_token`).then(res => res.json());

  if (json.token) {
    requestToken = json.token;
    requestTokenSecret = json.tokenSecret;
    return json.url;
  }
}

async function fetchAccessToken(pinCode) {
  const json = await fetch(`${serverUrl}/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      pinCode,
      token: requestToken,
      tokenSecret: requestTokenSecret
    })
  }).then(response => response.json());

  if (json.token) {
    oauth = json;
    localStorage.setItem("oauth", JSON.stringify(json));
    return true;
  }
}

async function fetchUser() {
  return fetch(`${serverUrl}/user`, {
    method: "GET",
    headers: getAuthorizationHeaders()
  }).then(res => res.json());
}

async function fetchTimeline(params = {}) {
  const url = buildURL(`${serverUrl}/timeline`, {
    count: 30,
    include_entities: true,
    tweet_mode: "extended",
    ...params
  });

  return fetch(url, {
    method: "GET",
    headers: getAuthorizationHeaders()
  }).then(res => res.json());
}

function getAuthorizationHeaders() {
  return {
    "x-authorization": `OAuth oauth_token=${oauth.token} oauth_token_secret=${oauth.tokenSecret}`
  };
}

function buildURL(urlString, params) {
  const url = new URL(urlString);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.href;
}

function getTweetDate(createdAt) {
  const currentDate = new Date();
  const creationDate = new Date(createdAt);
  const minuteDiff = Math.round((currentDate - creationDate) / 1000 / 60);
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
    const month = getMonth(creationDate.getMonth(), true);
    at = `${month} ${creationDate.getDate()}`;
  }
  return {
    createdAt,
    at
  };
}

export {
  isLoggedIn,
  fetchLoginUrl,
  fetchAccessToken,
  fetchUser,
  fetchTimeline,
  getTweetDate
};
