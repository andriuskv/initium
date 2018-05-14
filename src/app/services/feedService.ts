import { Injectable } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { TimeDateService } from "./timeDateService";
import { SettingService } from "./settingService";

@Injectable({
  providedIn: "root"
})
export class FeedService {
    constructor(
        private domSanitizer: DomSanitizer,
        private timeDateService: TimeDateService,
        private settingService: SettingService) {}

    getEntryLink(entry) {
        if (typeof entry.link === "string") {
            return entry.link;
        }
        else if (entry.link && entry.link.href) {
            return entry.link.href;
        }
        else if (entry.origEnclosureLink) {
            return entry.origEnclosureLink;
        }
    }

    getEntryDescription(entry) {
        if (entry.subtitle) {
            return entry.subtitle;
        }
        else if (entry.description) {
            return entry.description;
        }
        else if (typeof entry.content === "object") {
            return entry.content.content || "";
        }
    }

    parseEntries(entries) {
        return entries.map(entry => ({
            title: entry.title,
            link: this.getEntryLink(entry),
            description: this.domSanitizer.bypassSecurityTrustHtml(this.getEntryDescription(entry)),
            date: this.parseDate(entry.pubDate || entry.updated || "")
        }));
    }

    parseDate(dateStr) {
        if (!dateStr) {
            return;
        }
        const date = new Date(dateStr);
        const { format } = this.settingService.getSetting("time");

        return this.timeDateService.getDate("month day, year at hours:minutes period", {
            year: date.getFullYear(),
            month: date.getMonth(),
            day: date.getDate(),
            hours: date.getHours(),
            minutes: date.getMinutes(),
            hourFormat: format
        });
    }

    parseResults({ feed, rss }) {
        const newFeed: any = {};

        if (rss) {
            const { channel } = rss;

            newFeed.title = channel.title;
            newFeed.entries = channel.item;
            newFeed.description = channel.description;
            newFeed.updated = this.parseDate(channel.lastBuildDate);

            if (channel.image) {
                newFeed.image = channel.image.url;
            }
        }
        else if (feed) {
            newFeed.title = feed.title;
            newFeed.description = feed.subtitle;
            newFeed.entries = feed.entry;
            newFeed.updated = this.parseDate(feed.updated);

            if (feed.logo) {
                newFeed.image = feed.logo;
            }
        }
        return newFeed;
    }

    getFeed(url, title) {
        return this.fetchFeed(url).then(feed => {
            if (feed) {
                if (!Array.isArray(feed.entries)) {
                    throw new Error("Feed has no entries");
                }
                return Object.assign(feed, {
                    url,
                    title: title || feed.title || url,
                    newEntryCount: 0,
                    entries: this.parseEntries(feed.entries)
                });
            }
        });
    }

    getNewEntries(newEntries, entries) {
        return newEntries.filter(({ link, title }) => {
            return !entries.some(entry => entry.link === link || entry.title === title);
        }).map(entry => {
            entry.newEntry = true;
            return entry;
        });
    }

    updateFeed({ url, title, entries }) {
        return this.getFeed(url, title).then(feed => {
            if (feed) {
                return {
                    updated: feed.updated,
                    entries: this.getNewEntries(feed.entries, entries)
                };
            }
        });
    }

    fetchFeed(feedUrl) {
        const query = encodeURIComponent(`select * from xml where url = '${feedUrl}'`);
        const params = `q=${query}&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys`;
        const url = `https://query.yahooapis.com/v1/public/yql?${params}`;

        return fetch(url)
            .then(response => response.json())
            .then(json => {
                const { results } = json.query;

                if (results) {
                    return this.parseResults(results);
                }
            })
            .catch(error => {
                console.log(error);
            });
    }
}
