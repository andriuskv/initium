import { Injectable } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

@Injectable()
export class FeedService {
    constructor(private domSanitizer: DomSanitizer) {
        this.domSanitizer = domSanitizer;
    }

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

    getEntryDesc(entry) {
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

    parseEntries(entries, newEntry) {
        return entries.map(entry => ({
            newEntry,
            desc: this.domSanitizer.bypassSecurityTrustHtml(this.getEntryDesc(entry)),
            link: this.getEntryLink(entry),
            title: entry.title,
            date: entry.pubDate || entry.updated || ""
        }));
    }

    parseResults({ feed, rss }) {
        let title = "";
        let entries = null;

        if (rss) {
            title = rss.channel.title;
            entries = rss.channel.item;
        }
        else if (feed) {
            title = feed.title;
            entries = feed.entry;
        }
        return { title, entries };
    }

    getFeed(url, title, updating = false) {
        return this.fetchFeed(url).then(feed => {
            if (feed) {
                return {
                    url,
                    title: title || feed.title,
                    newEntryCount: 0,
                    entries: this.parseEntries(feed.entries, updating)
                };
            }
        });
    }

    getNewEntries(newEntries, entries) {
        return newEntries.filter(({ link, title }) => {
            return !entries.some(entry => entry.link === link || entry.title === title);
        });
    }

    updateFeed({ url, title, entries }) {
        return this.getFeed(url, title, true).then(newFeed => {
            return newFeed ? this.getNewEntries(newFeed.entries, entries) : [];
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
