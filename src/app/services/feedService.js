export class FeedService {
    fetchFeed(url) {
        return fetch(`https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=14&q=${url}`)
        .then(response => response.json())
        .then(data => {
            const feed = data.responseData.feed;

            if (feed && feed.entries) {
                return feed;
            }
        });
    }
}
