import { getRandomString } from "../utils";
import { getDate } from "./timeDate";
import * as chromeStorage from "./chromeStorage";

function getStoredFeeds() {
  return chromeStorage.get("feeds");
}

async function hasStoredFeeds() {
  const feeds = await getStoredFeeds();

  return feeds.length > 0;
}

function fetchFeedData(url) {
  return fetch(`${process.env.SERVER_URL}/feed?url=${url}`).then(res => res.json());
}

async function fetchFeed(feed) {
  const data = await fetchFeedData(feed.url);

  if (data.feed) {
    if (Array.isArray(data.feed.items)) {
      return parseFeed(data.feed, feed);
    }
    return { message: "Feed has no entries." };
  }
  return { message: "Feed was not found." };
}

async function updateFeed({ url, entries, newEntryCount }) {
  const data = await fetchFeedData(url);

  if (data.feed) {
    const newEntries = getNewEntries(data.feed.items, entries);
    let entryCount = newEntryCount + newEntries.length;

    if (entryCount > 99) {
      entryCount = 99;
    }
    return {
      updated: parseDate(data.feed.lastBuildDate),
      entries: newEntries,
      newEntryCount: entryCount
    };
  }
}

function getNewEntries(newEntries, entries) {
  return newEntries.reduce((newEntries, entry) => {
    const notDuplicate = !entries.some(({ link, title }) => {
      return link === getEntryLink(entry) || title === entry.title.trim();
    });

    if (notDuplicate) {
      newEntries.push(parseEntry(entry, true));
    }
    return newEntries;
  }, []);
}

function parseFeed(feed, { title, url }) {
  const data = {};
  const image = feed.image?.url;
  const updated = parseDate(feed.lastBuildDate);

  if (image) {
    data.image = image;
  }

  if (updated) {
    data.updated = updated;
  }
  return {
    ...data,
    url,
    // If feed's title was manually changed, don't overwrite it.
    title: title || feed.title,
    description: feed.description,
    newEntryCount: 0,
    entries: parseEntries(feed.items)
  };
}

function parseDate(dateStr) {
  if (!dateStr) {
    return;
  }
  const date = new Date(dateStr);

  return getDate("month day, year at hours:minutes period", {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
    hours: date.getHours(),
    minutes: date.getMinutes()
  });
}

function parseEntries(entries) {
  return entries.map(entry => parseEntry(entry));
}

function parseEntry(entry, newEntry = false) {
  const content = entry.content ? entry.content.trim() : "";

  return {
    newEntry,
    id: getRandomString(),
    title: entry.title.trim(),
    link: getEntryLink(entry),
    thumbnail: entry.thumbnail,
    description: content,
    date: parseDate(entry.pubDate),
    truncated: needTruncation(content)
  };
}

function getEntryLink(entry) {
  if (entry.link) {
    return entry.link.trim();
  }
  else if (entry.guid) {
    return entry.guid.trim();
  }
  return "javascript: void 0;";
}

function needTruncation(content) {
  const div = document.createElement("div");

  // Simulate original container styles.
  div.classList.add("feed-entry-description");
  div.style.width = "558px";
  div.insertAdjacentHTML("beforeend", content);
  document.body.appendChild(div);

  const { offsetHeight } = div;

  div.remove();
  return offsetHeight > 240;
}

export {
  getStoredFeeds,
  hasStoredFeeds,
  fetchFeed,
  updateFeed
};
