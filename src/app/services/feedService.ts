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
        private settingService: SettingService
    ) {}

    getFeed(url, title) {
        return this.fetchFeed(url).then(feed => {
            if (feed) {
                if (Array.isArray(feed.items)) {
                    return { url, title, ...this.parseFeed(feed) };
                }
                throw new Error("Feed has no entries");
            }
            throw new Error("Feed was not found");
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
        return this.getFeed(url, title).then(feed => ({
            updated: feed.updated,
            entries: this.getNewEntries(feed.entries, entries)
        }));
    }

    fetchFeed(url) {
        return fetch(`${process.env.SERVER_URL}/feed?url=${url}`)
            .then(response => response.json())
            .then(({ feed }) => feed)
            .catch(error => {
                console.log(error);
            });
    }

    parseFeed(feed) {
        return {
            title: feed.title,
            description: feed.description,
            image: feed.image ? feed.image.url : "",
            newEntryCount: 0,
            entries: this.parseEntries(feed.items),
            updated: this.parseDate(feed.lastBuildDate)
        };
    }

    parseEntries(entries) {
        return entries.map(entry => ({
            title: entry.title,
            link: entry.link,
            description: this.domSanitizer.bypassSecurityTrustHtml(entry.content),
            date: this.parseDate(entry.pubDate)
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
}
