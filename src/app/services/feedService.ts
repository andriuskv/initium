export class FeedService {
    parseResults(results) {
        let title = "";
        let entries = null;

        if (results.rss) {
            title = results.rss.channel.title;
            entries = results.rss.channel.item;
        }
        if (results.feed) {
            title = results.feed.title;
            entries = results.feed.entry;
        }
        return { title, entries };
    }

    fetchFeed(url) {
        const query = `select%20*%20from%20xml%20where%20url%20%3D%20'${encodeURIComponent(url)}'`;
        const params = `q=${query}&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys`;

        return fetch(`https://query.yahooapis.com/v1/public/yql?${params}`)
            .then(response => response.json())
            .then(json => {
                const results = json.query.results;

                if (results) {
                    return this.parseResults(results);
                }
            });
    }
}
