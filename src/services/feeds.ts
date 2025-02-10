import type { Entry, Feeds, FeedType } from "types/feed";
import type { TimeDateSettings } from "types/settings";
import { getRandomString } from "../utils";
import { getSetting } from "./settings";
import { formatDate } from "./timeDate";
import * as chromeStorage from "./chromeStorage";

type FetchEntry = {
  id: string,
  title: string,
  description: string,
  link?: string,
  guid?: string,
  content?: string,
  thumbnail?: string,
  pubDate: string,
}

type FetchFeed = {
  id: string,
  title: string,
  url: string,
  description: string,
  lastBuildDate: string,
  newEntryCount: number,
  items: FetchEntry[]
  image?: { url: string }
}

function getStoredFeeds(): Promise<Feeds | null> {
  return chromeStorage.get("feeds");
}

async function hasStoredFeeds() {
  const feeds = await getStoredFeeds() || { active: [] };

  return feeds.active.length > 0;
}

function fetchFeedData(url: string): Promise<{ feed: FetchFeed }> {
  return fetch(`${process.env.SERVER_URL}/feed?url=${url}`).then(res => res.json());
}

async function fetchFeed(feed: { url: string, title: string }): Promise<FeedType | { message: string }> {
  const data = await fetchFeedData(feed.url);

  if (data.feed) {
    if (Array.isArray(data.feed.items)) {
      return parseFeed(data.feed, feed);
    }
    return { message: "Feed has no entries." };
  }
  return { message: "Feed was not found." };
}

async function updateFeed({ url, entries, newEntryCount }: { url: string, entries: Entry[], newEntryCount: number }) {
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

function getNewEntries(newEntries: FetchEntry[], entries: Entry[]): Entry[] {
  return newEntries.reduce((newEntries, entry) => {
    const notDuplicate = !entries.some(({ link, title }) => {
      return link === getEntryLink(entry) || title === entry.title.trim();
    });

    if (notDuplicate) {
      newEntries.push(parseEntry(entry, true));
    }
    return newEntries;
  }, [] as Entry[]);
}

function parseFeed(feed: FetchFeed, { title, url }: { title: string, url: string }): FeedType {
  const image = feed.image?.url;
  const updated = parseDate(feed.lastBuildDate);
  const data: FeedType = {
    url,
    id: getRandomString(),
    // Don't overwrite manually changed title
    title: title || feed.title,
    description: feed.description,
    newEntryCount: 0,
    entries: parseEntries(feed.items)
  };

  if (image) {
    data.image = image;
  }

  if (updated) {
    data.updated = updated;
  }

  return data;
}

function parseDate(dateStr: string) {
  if (!dateStr) {
    return;
  }
  const { dateLocale } = getSetting("timeDate") as TimeDateSettings;
  const date = new Date(dateStr);

  return formatDate(date, { locale: dateLocale, includeTime: true });
}

function parseEntries(entries: FetchEntry[]): Entry[] {
  return entries.map(entry => parseEntry(entry));
}

function parseEntry(entry: FetchEntry, newEntry = false): Entry {
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

function getEntryLink(entry: FetchEntry) {
  if (entry.link) {
    return entry.link.trim();
  }
  else if (entry.guid) {
    return entry.guid.trim();
  }
  return "javascript: void 0;";
}

function needTruncation(content: string) {
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
