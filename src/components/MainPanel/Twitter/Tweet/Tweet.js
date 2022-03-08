import { useState, useRef } from "react";
import { dispatchCustomEvent } from "utils";
import { getCachedUser, cacheUser, fetchUserByHandle } from "services/twitter";
import Icon from "components/Icon";
import "./tweet.css";

export default function Tweet({ tweet, activateMedia, showUserCard, handleTweetPointerLeave }) {
  const [fetchingUser, setFetchingUser] = useState(false);
  const hoveringOverHandle = useRef(false);

  function handleTweetClick({ target }, { tweetUrl, quotedTweet }) {
    if (target.closest("a") || !window.getSelection().isCollapsed) {
      return;
    }

    if (target.closest(".quoted-tweet")) {
      window.open(quotedTweet.tweetUrl, "_blank");
    }
    else {
      window.open(tweetUrl, "_blank");
    }
  }

  async function handleTweetTextPointerOver({ target }) {
    if (target.nodeName === "A" && target.classList.contains("handle")) {
      const handle = target.textContent.slice(1);
      const cachedUser = getCachedUser(target.textContent);

      if (cachedUser) {
        target.addEventListener("pointerleave", handleTweetPointerLeave, { once: true });
        showUserCard(target, cachedUser);
      }
      else {
        if (fetchingUser) {
          return;
        }
        hoveringOverHandle.current = true;

        setFetchingUser(true);

        try {
          const user = await fetchUserByHandle(handle);

          if (hoveringOverHandle.current) {
            target.addEventListener("pointerleave", handleTweetPointerLeave, { once: true });
            showUserCard(target, user);

            hoveringOverHandle.current = false;
          }
          cacheUser(user);
        } catch (e) {
          console.log(e);
        } finally {
          setFetchingUser(false);
        }
      }
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
      activateMedia(media);
    }
  }

  function handleTweetUserPointerEnter(event, user, isQuotedTweet) {
    showUserCard(event.currentTarget, user, isQuotedTweet);
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
    const maxVideoHeight = isQuotedTweet ? maxImageHeight : "500px";
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

  return (
    <li className="tweet" onClick={event => handleTweetClick(event, tweet)}>
      {tweet.retweetedBy && (
        <div className="retweet">
          <Icon id="retweet"/>
          <a href={tweet.retweetedBy.url} className="retweet-by" target="_blank" rel="noreferrer"
            onPointerEnter={event => handleTweetUserPointerEnter(event, tweet.retweetedBy)}
            onPointerLeave={handleTweetPointerLeave}>{tweet.retweetedBy.name} Retweeted</a>
        </div>
      )}
      <div className="tweet-content">
        <div className="tweet-user-image-container">
          <a href={tweet.user.url} className="tweet-user-image-link" target="_blank" rel="noreferrer"
            onPointerEnter={event => handleTweetUserPointerEnter(event, tweet.user)} onPointerLeave={handleTweetPointerLeave}>
            <img src={tweet.user.profileImageUrl} className="tweet-user-image" width="48px" height="48px" loading="lazy" alt=""/>
          </a>
        </div>
        <div className="tweet-content-body">
          <div className="tweet-info">
            <a href={tweet.user.url} className="tweet-user-info" target="_blank" rel="noreferrer"
              onPointerEnter={event => handleTweetUserPointerEnter(event, tweet.user)} onPointerLeave={handleTweetPointerLeave}>
              <span className="tweeted-by-name">{tweet.user.name}</span>
              {tweet.user.verified ? <Icon id="verified" className="tweet-verified-icon"/> : null}
              <span className="tweet-user-handle">
                <span>{tweet.user.handle}</span>
              </span>
            </a>
            <span className="tweet-info-separator">·</span>
            <a href={tweet.tweetUrl} className="tweeted-on" target="_blank" rel="noreferrer">{tweet.date.at}</a>
          </div>
          {tweet.text && (
            <p className="tweet-text" dangerouslySetInnerHTML={{ __html: tweet.text }}
              onPointerOver={handleTweetTextPointerOver}></p>
          )}
          {tweet.media.length > 0 && getTweetMedia(tweet)}
          {tweet.quotedTweet && (
            <div className="quoted-tweet">
              <div className="tweet-info">
                <div className="tweet-user-info quoted-tweet-info"
                  onPointerEnter={event => handleTweetUserPointerEnter(event, tweet.quotedTweet.user, true)}
                  onPointerLeave={handleTweetPointerLeave}>
                  <img src={tweet.quotedTweet.user.profileImageUrl} className="quoted-tweet-user-image" loading="lazy" alt=""/>
                  <span className="tweeted-by-name">{tweet.quotedTweet.user.name}</span>
                  {tweet.quotedTweet.user.verified ? <Icon id="verified" className="tweet-verified-icon"/> : null}
                  <span className="tweet-user-handle">
                    <span>{tweet.quotedTweet.user.handle}</span>
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
            <Icon id="retweet" className="tweet-stat-icon"/>
            <span className="tweet-stat-value">{tweet.retweetCount}</span>
            <Icon id="heart" className="tweet-stat-icon"/>
            <span className="tweet-stat-value">{tweet.likeCount}</span>
          </div>
        </div>
      </div>
    </li>
  );
}
