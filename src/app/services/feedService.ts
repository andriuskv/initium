export class FeedService {
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
