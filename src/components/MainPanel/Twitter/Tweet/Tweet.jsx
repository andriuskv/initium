import { useState, useRef } from "react";
import { dispatchCustomEvent } from "utils";
import { getCachedUser, cacheUser, fetchUserByHandle } from "services/twitter";
import Icon from "components/Icon";
import "./tweet.css";

export default function Tweet({ tweet, settings, activateMedia, showUserCard, handleTweetPointerLeave }) {
  const [fetchingUser, setFetchingUser] = useState(false);
  const hoveringOverHandles = useRef({});
  const currentVideoQuality = useRef(settings.videoQuality);

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
      const cachedUser = getCachedUser(target.textContent);

      hoveringOverHandles.current[target.textContent] = true;
      target.addEventListener("pointerleave", handleLinkPointerLeave, { once: true });

      if (cachedUser) {
        showUserCard(target, cachedUser);
      }
      else {
        if (fetchingUser) {
          return;
        }
        setFetchingUser(true);

        try {
          const handle = target.textContent.slice(1);
          const user = await fetchUserByHandle(handle);

          if (hoveringOverHandles.current[target.textContent]) {
            showUserCard(target, user);
            delete hoveringOverHandles.current[target.textContent];
          }
          cacheUser(user);
        } catch (e) {
          console.log(e);
        } finally {
          setFetchingUser(false);
        }
      }
    }
    else {
      delete hoveringOverHandles.current[target.textContent];
    }
  }

  function handleLinkPointerLeave(event) {
    delete hoveringOverHandles.current[event.target.textContent];
    handleTweetPointerLeave(event);
  }

  function handleTweetImageClick(event, media, index) {
    event.stopPropagation();

    dispatchCustomEvent("tweet-image-viewer-visible", {
      startIndex: index,
      images: media
    });
  }

  function handleTweetVideoClick(event, media) {
    const element = event.target;

    event.preventDefault();
    event.stopPropagation();

    if (element.nodeName === "VIDEO") {
      if (element.paused) {
        element.play();
      }
      else {
        element.pause();
      }
    }
    else {
      activateMedia(media);
    }
  }

  function handleVideoLoadStart(event) {
    event.currentTarget.volume = settings.videoVolume;
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

  function getTweetVideo(media) {
    let video = null;

    if (media.type === "gif") {
      video = <video src={media.url} className="tweet-video" loop autoPlay></video>;
    }
    else {
      let src = "";
      let autoPlay = true;

      if (currentVideoQuality.current !== settings.videoQuality) {
        currentVideoQuality.current = settings.videoQuality;
        autoPlay = false;
      }

      if (media.url) {
        src = media.url;
      }
      else if (media.sources[settings.videoQuality]) {
        src = media.sources[settings.videoQuality];
      }
      else {
        for (const key of Object.keys(media.sources)) {
          if (media.sources[key]) {
            src = media.sources[key];
            break;
          }
        }
      }
      video = <video src={src} className="tweet-video" controls loop={media.durationInSeconds < 60}
        autoPlay={autoPlay} poster={media.thumbUrl} onLoadStart={handleVideoLoadStart}></video>;
    }

    return (
      <div className="tweet-video-container" style={{ "--height": `${media.height}px` }}
        onClick={event => handleTweetVideoClick(event, media)}>
        {media.active ? video : (
          <>
            <div className="tweet-media-item">
              <img src={media.thumbUrl} className="tweet-image" alt=""/>
            </div>
            <Icon id="play-circle" className="tweet-video-play-icon"/>
          </>
        )}
        {media.type === "gif" ? (
          <div className="tweet-media-info">GIF</div>
        ) : (
          media.duration && !media.active && <div className="tweet-media-info">{media.duration}</div>
        )}
      </div>
    );
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
                <img src={media.url} className={`tweet-image ${media.smallestDimension}`}
                  width={`${media.width}px`} height={`${media.height}px`} loading="lazy" alt=""/>
              </div>
            ))}
          </div>
        ) : getTweetVideo(mediaItem)}
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
            onPointerLeave={handleLinkPointerLeave}>{tweet.retweetedBy.name} Retweeted</a>
        </div>
      )}
      <div className="tweet-content">
        <div className="tweet-user-image-container">
          <a href={tweet.user.url} className="tweet-user-image-link" target="_blank" rel="noreferrer"
            onPointerEnter={event => handleTweetUserPointerEnter(event, tweet.user)} onPointerLeave={handleLinkPointerLeave}>
            <img src={tweet.user.profileImageUrl} className="tweet-user-image" width="48px" height="48px" loading="lazy" alt=""/>
          </a>
        </div>
        <div className="tweet-content-body">
          <div className="tweet-info">
            <a href={tweet.user.url} className="tweet-user-info" target="_blank" rel="noreferrer"
              onPointerEnter={event => handleTweetUserPointerEnter(event, tweet.user)} onPointerLeave={handleLinkPointerLeave}>
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
                  onPointerLeave={handleLinkPointerLeave}>
                  <img src={tweet.quotedTweet.user.profileImageUrl} className="quoted-tweet-user-image" width="24px" height="24px" loading="lazy" alt=""/>
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
