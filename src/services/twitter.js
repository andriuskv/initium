import { getMonthName } from "./timeDate";

const serverUrl = `${process.env.SERVER_URL}/twitter`;
const userCache = {};
const users = JSON.parse(localStorage.getItem("twitter_users")) || [];
let selectedUserIndex = users.findIndex(user => user.selected);
let oauth = null;
let requestToken = "";
let requestTokenSecret = "";

if (users.length) {
  const activeUserIndex = users.findIndex(user => user.active);

  if (selectedUserIndex < 0) {
    if (activeUserIndex < 0) {
      setSelectedActiveUser(0);
    }
    else {
      setSelectedActiveUser(activeUserIndex);
    }
  }
  else if (activeUserIndex < 0) {
    users[selectedUserIndex].active = true;
  }
}

function hasUsers() {
  return users.length > 0;
}

function getUsers() {
  return users;
}

function addUser(newUser) {
  removeSelectedActiveUser();

  if (oauth) {
    newUser.token = oauth.token;
    newUser.tokenSecret = oauth.tokenSecret;
    oauth = null;
  }
  users.push(newUser);
  setSelectedActiveUser(users.length - 1);
  saveUsers(users);
  return users;
}

function updateUser(handle, data) {
  const index = users.findIndex(user => user.handle === handle);

  users[index] = data;
  saveUsers(users);
}

function markUserAsSelected(userToSelect, keepActive) {
  const index = users.findIndex(user => user.handle === userToSelect.handle);

  removeSelectedActiveUser(keepActive);
  setSelectedActiveUser(index);
  saveUsers(users);
}

function getSelectedUser() {
  return users[selectedUserIndex];
}

function removeSelectedUser() {
  users.splice(selectedUserIndex, 1);

  if (users.length) {
    setSelectedActiveUser(0);
  }
  else {
    selectedUserIndex = -1;
  }
  saveUsers(users);
  return users.length > 0;
}

function setSelectedActiveUser(index) {
  selectedUserIndex = index;
  users[index].selected = true;
  users[index].active = true;
}

function removeSelectedActiveUser(keepActive) {
  const user = users[selectedUserIndex];

  if (user) {
    delete user.selected;

    if (!keepActive) {
      delete user.active;
    }
  }
}

function removeActiveUserProp(handle) {
  const user = users.find(user => user.handle === handle);

  delete user.active;
  saveUsers(users);
}

function updateUserHighlightColor(color, handle) {
  const user = users.find(user => user.handle === handle);

  user.highlightColor = color;
  saveUsers(users);
}

function cacheUser(user) {
  userCache[user.handle.toLowerCase()] = user;
}

function getCachedUser(handle) {
  return userCache[handle.toLowerCase()];
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

async function fetchUser(user) {
  return fetch(`${serverUrl}/user`, {
    method: "GET",
    headers: getAuthorizationHeaders(user)
  }).then(res => res.json());
}

async function fetchUserByHandle(handle) {
  return fetch(`${serverUrl}/users/${handle}`, {
    method: "GET",
    headers: getAuthorizationHeaders(getSelectedUser())
  }).then(res => res.json());
}

async function fetchTimeline(user, params = {}) {
  const url = buildURL(`${serverUrl}/timeline`, {
    count: 30,
    include_entities: true,
    tweet_mode: "extended",
    ...params
  });

  return fetch(url, {
    method: "GET",
    headers: getAuthorizationHeaders(user)
  }).then(res => res.json());
}

function getAuthorizationHeaders(user) {
  let token = "";
  let tokenSecret = "";

  if (user) {
    ({ token, tokenSecret } = user);
  }
  else if (oauth) {
    ({ token, tokenSecret } = oauth);
  }
  else {
    throw new Error("Access token not found.");
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
  getUsers,
  addUser,
  updateUser,
  getSelectedUser,
  removeSelectedUser,
  updateUserHighlightColor,
  markUserAsSelected,
  removeActiveUserProp,
  cacheUser,
  getCachedUser,
  fetchLoginUrl,
  fetchAccessToken,
  fetchUser,
  fetchUserByHandle,
  fetchTimeline,
  getTweetDate
};
