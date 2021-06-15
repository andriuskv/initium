import { getMonthName } from "./timeDate";

const serverUrl = `${process.env.SERVER_URL}/twitter`;
let users = JSON.parse(localStorage.getItem("twitter_users")) || [];
let activeUserIndex = users.findIndex(user => user.active);
let oauth = null;
let requestToken = "";
let requestTokenSecret = "";

function hasUsers() {
  return users.length > 0;
}

function addUser(newUser) {
  users = users.map(user => {
    delete user.active;
    return user;
  });
  newUser.active = true;

  if (oauth) {
    newUser.token = oauth.token;
    newUser.tokenSecret = oauth.tokenSecret;
    oauth = null;
  }
  const index = users.findIndex(user => user.handle === newUser.handle);

  if (index >= 0) {
    activeUserIndex = index;
    users[index] = { ...users[index], ...newUser };
  }
  else {
    activeUserIndex = users.length;
    users.push(newUser);
  }
  saveUsers(users);
  return users;
}

function updateActiveUser(index) {
  users = users.map(user => {
    delete user.active;
    return user;
  });

  activeUserIndex = index;
  users[index].active = true;

  saveUsers(users);
}

function getActiveUser() {
  return users[activeUserIndex];
}

function removeActiveUser() {
  users.splice(activeUserIndex, 1);

  if (users.length) {
    activeUserIndex = 0;
    users[activeUserIndex].active = true;
  }
  else {
    activeUserIndex = -1;
  }
  saveUsers(users);
  return users.length > 0;
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
  }).then(res => res.json());

  if (json.token) {
    oauth = json;
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
  let token = "";
  let tokenSecret = "";

  if (oauth) {
    ({ token, tokenSecret } = oauth);
  }
  else {
    ({ token, tokenSecret } = users.find(user => user.active));
  }
  return {
    "x-authorization": `OAuth oauth_token=${token} oauth_token_secret=${tokenSecret}`
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
    const month = getMonthName(creationDate.getMonth(), true);
    at = `${month} ${creationDate.getDate()}`;
  }
  return {
    createdAt,
    at
  };
}

function saveUsers(users) {
  localStorage.setItem("twitter_users", JSON.stringify(users));
}

export {
  hasUsers,
  addUser,
  updateActiveUser,
  getActiveUser,
  removeActiveUser,
  fetchLoginUrl,
  fetchAccessToken,
  fetchUser,
  fetchTimeline,
  getTweetDate
};
