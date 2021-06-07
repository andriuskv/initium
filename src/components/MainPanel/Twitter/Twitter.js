import { useState, useEffect, useRef } from "react";
import { dispatchCustomEvent } from "utils";
import { isLoggedIn, fetchUser, fetchTimeline, getTweetDate } from "services/twitter";
import ToTop from "components/ToTop";
import Icon from "components/Icon";
import "./twitter.css";
import Form from "./Form";

export default function Twitter({ showIndicator }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [tweetsToLoad, setTweetsToLoad] = useState([]);
  const [fetchingMoreTweets, setFetchingMoreTweets] = useState(false);
  const lastUpdate = useRef(0);
  const timelineTimeoutId = useRef(0);

  useEffect(() => {
    if (isLoggedIn()) {
      loadContent();
    }
    else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (tweets.length) {
      scheduleTimelineUpdate();
    }
    return () => {
      clearTimeout(timelineTimeoutId.current);
    };
  }, [loading, tweets, tweetsToLoad]);

  async function loadContent() {
    try {
      const [user, timeline] = await Promise.all([fetchUser(), fetchTimeline()]);

      if (user && timeline) {
        lastUpdate.current = Date.now();

        setUser(user);
        setTweets(timeline.tweets);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  function scheduleTimelineUpdate() {
    timelineTimeoutId.current = window.setTimeout(() => {
      const currentDate = Date.now();

      if (currentDate - lastUpdate.current > 600000) {
        lastUpdate.current = currentDate;
        updateTimeline();
      }
      else {
        updateTweetTime();
      }
    }, 60000);
  }

  async function updateTimeline() {
    const lastTweetId = tweets[tweets.length - 1].id;
    const timeline = await fetchTimeline({ since_id: lastTweetId });

    if (timeline) {
      const currentTweets = tweetsToLoad.concat(tweets);
      const newTweets = [];

      for (const tweet of timeline.tweets) {
        const foundTweet = currentTweets.find(({ id }) => tweet.id === id);

        if (foundTweet) {
          foundTweet.retweetCount = tweet.retweetCount;
          foundTweet.likeCount = tweet.likeCount;
          foundTweet.date = getTweetDate(foundTweet.date.createdAt);
        }
        else {
          newTweets.push(tweet);
        }
      }

      setTweets([...tweets]);

      if (newTweets.length) {
        setTweetsToLoad(newTweets.concat(tweetsToLoad));
        showIndicator("twitter");
      }
    }
    else {
      scheduleTimelineUpdate();
    }
  }

  function updateTweetTime() {
    setTweets(tweets.map(tweet => {
      tweet.date = getTweetDate(tweet.date.createdAt);
      return tweet;
    }));
  }

  async function fetchMoreTweets() {
    if (fetchingMoreTweets) {
      return;
    }
    setFetchingMoreTweets(true);

    const { id } = tweets[tweets.length - 1];
    const timeline = await fetchTimeline({ max_id: id });

    if (timeline) {
      const newTweets = timeline.tweets.filter(tweet => tweet.id !== id);

      if (newTweets.length) {
        setTweets(tweets.concat(newTweets));
      }
    }
    setFetchingMoreTweets(false);
  }

  function logout() {
    setUser(null);
    setTweets([]);
    setTweetsToLoad([]);
    localStorage.removeItem("oauth");
  }

  function viewNewTweets() {
    setTweets(tweetsToLoad.concat(tweets));
    setTweetsToLoad([]);
  }

  function handleTweetClick({ target }, { tweetUrl, quotedTweet }) {
    if (target.closest("a") || !window.getSelection().isCollapsed) {
      return;
    }

    if (target.closest(".tweet-quoted-tweet")) {
      window.open(quotedTweet.tweetUrl, "_blank");
    }
    else {
      window.open(tweetUrl, "_blank");
    }
  }

  function handleTweetImageClick(event, media, index) {
    event.stopPropagation();

    dispatchCustomEvent("tweet-image-viewer-visible", {
      startIndex: index,
      images: media
    });
  }

  function handleTweetVideoClick(event, media) {
    event.preventDefault();
    event.stopPropagation();

    if (event.target.nodeName === "VIDEO") {
      const video = event.target;

      if (video.paused) {
        video.play();
      }
      else {
        video.pause();
      }
    }
    else {
      media.active = true;
      setTweets([...tweets]);
    }
  }

  function getImageContainerClasses(images) {
    if (images.length === 1) {
      return "";
    }
    const classes = {
      "2": "two",
      "3": "three",
      "4": "four"
    };
    return ` multiple ${classes[images.length]}`;
  }

  function getTweetMedia(tweet, isQuotedTweet = false) {
    const [mediaItem] = tweet.media;
    const maxImageHeight = "284px";
    const maxVideoHeight = isQuotedTweet ? maxImageHeight : "506px";
    const maxHeight = mediaItem.type === "photo" ? maxImageHeight : maxVideoHeight;
    const imageContainerClasses = getImageContainerClasses(tweet.media);

    return (
      <div className="tweet-media-container" style={{ "--max-height": maxHeight }}>
        {mediaItem.type === "photo" ? (
          <div className={`tweet-image-container${imageContainerClasses}`}>
            {tweet.media.map((media, i) => (
              <div className="tweet-media-item" onClick={event => handleTweetImageClick(event, tweet.media, i)} key={i}>
                <img src={media.url} className={`tweet-image ${media.smallestDimension}`} alt=""/>
              </div>
            ))}
          </div>
        ) : (
          <div className="tweet-video-container" style={{ "--height": `${mediaItem.height}px` }}
            onClick={event => handleTweetVideoClick(event, mediaItem)}>
            {mediaItem.active ? (
              <video src={mediaItem.url} className="tweet-video" controls={mediaItem.type === "video"}
                loop={mediaItem.type === "gif" || mediaItem.durationInSeconds < 60} autoPlay>
              </video>
            ) : (
              <>
                <div className="tweet-media-item">
                  <img src={mediaItem.thumbUrl} className="tweet-image" alt=""/>
                </div>
                <Icon id="play-circle" className="tweet-video-play-icon"/>
              </>
            )}
            {mediaItem.type === "gif" ? (
              <div className="tweet-media-info">GIF</div>
            ) : (
              mediaItem.duration && !mediaItem.active && <div className="tweet-media-info">{mediaItem.duration}</div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (loading || !user) {
    return <Form initialLoading={loading} loadContent={loadContent}/>;
  }
  return (
    <div className="twitter-content" style={{ "--profile-color": user.profileColor }}>
      <div className="main-panel-item-header">
        <a href={user.homepage} className="twitter-user" target="_blank" rel="noreferrer">
          <img src={user.profileImage} className="twitter-user-image" alt=""/>
          <span className="twitter-user-name">{user.name}</span>
          <span className="twitter-user-handle">{user.handle}</span>
        </a>
        <button className="btn icon-btn main-panel-item-header-btn"
          title="Log out" onClick={logout}>
          <Icon id="logout"/>
        </button>
      </div>
      <ul className="tweets">
        {tweetsToLoad.length > 0 && (
          <li>
            <button className="btn text-btn new-tweet-btn" onClick={viewNewTweets}>View {tweetsToLoad.length} new tweet{tweetsToLoad.length > 1 ? "s": ""}</button>
          </li>
        )}
        {tweets.map(tweet => (
          <li className="tweet" onClick={event => handleTweetClick(event, tweet)} key={tweet.id}>
            {tweet.retweetedBy && (
              <div className="retweet">
                <Icon id="retweet"/>
                <a href={tweet.retweetedBy.userUrl} className="retweet-by" target="_blank" rel="noreferrer">{tweet.retweetedBy.name} Retweeted</a>
              </div>
            )}
            <div className="tweet-content">
              <div className="tweet-user-image-container">
                <a href={tweet.userUrl} className="tweet-user-image-link" target="_blank" rel="noreferrer">
                  <img src={tweet.profileImg} className="tweet-user-image" width="48px" height="48px" loading="lazy" alt=""/>
                </a>
              </div>
              <div className="tweet-content-body">
                <div className="tweet-info">
                  <a href={tweet.userUrl} className="tweet-user-info" target="_blank" rel="noreferrer">
                    <span className="tweeted-by-name">{tweet.name}</span>
                    {tweet.verified ? <Icon id="verified" className="tweet-verified-icon"/> : null}
                    <span className="tweet-user-handle">
                      <span>{tweet.handle}</span>
                    </span>
                  </a>
                  <span className="tweet-info-separator">·</span>
                  <a href={tweet.tweetUrl} className="tweeted-on" target="_blank" rel="noreferrer">{tweet.date.at}</a>
                </div>
                {tweet.text && <p className="tweet-text" dangerouslySetInnerHTML={{ __html: tweet.text }}></p>}
                {tweet.media.length > 0 && getTweetMedia(tweet)}
                {tweet.quotedTweet && (
                  <div className="quoted-tweet">
                    <div className="tweet-info">
                      <div className="tweet-user-info quoted-tweet-info">
                        <img src={tweet.quotedTweet.profileImg} className="quoted-tweet-user-image" loading="lazy" alt=""/>
                        <span className="tweeted-by-name">{tweet.quotedTweet.name}</span>
                        {tweet.quotedTweet.verified ? <Icon id="verified" className="tweet-verified-icon"/> : null}
                        <span className="tweet-user-handle">
                          <span>{tweet.quotedTweet.handle}</span>
                        </span>
                        <span className="tweet-info-separator">·</span>
                        <span className="quoted-tweet-date">{tweet.quotedTweet.date.at}</span>
                      </div>
                    </div>
                    {tweet.quotedTweet.text && <p className="tweet-text" dangerouslySetInnerHTML={{ __html: tweet.quotedTweet.text }}></p>}
                    {tweet.quotedTweet.media.length > 0 && getTweetMedia(tweet.quotedTweet, true)}
                  </div>
                )}
                <div className="tweet-stats-container">
                  <Icon id="retweet"/>
                  <span>{tweet.retweetCount}</span>
                  <Icon id="heart"/>
                  <span>{tweet.likeCount}</span>
                </div>
              </div>
            </div>
          </li>
        ))}
        <li>
          <button className="btn text-btn more-tweets-btn" onClick={fetchMoreTweets} disabled={fetchingMoreTweets}>
            {fetchingMoreTweets ? "Loading..." : "Show More"}
          </button>
        </li>
      </ul>
      <ToTop/>
    </div>
  );
}
