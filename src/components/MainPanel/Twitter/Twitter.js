import { useState, useEffect, useRef } from "react";
import { dispatchCustomEvent } from "utils";
import { hasUsers, addUser, updateActiveUser, getActiveUser, removeActiveUser, getCachedUser, cacheUser, fetchUser, fetchUserByHandle, fetchTimeline, getTweetDate } from "services/twitter";
import ToTop from "components/ToTop";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import Spinner from "components/Spinner";
import "./twitter.css";
import Form from "./Form";
import UserCard from "./UserCard";

export default function Twitter({ showIndicator }) {
  const [loading, setLoading] = useState(true);
  const [addingAnotherUser, setAddingAnotherUser] = useState(false);
  const [user, setUser] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [tweetsToLoad, setTweetsToLoad] = useState([]);
  const [users, setUsers] = useState(null);
  const [activeUser, setActiveUser] = useState({});
  const [fetchingMoreTweets, setFetchingMoreTweets] = useState(false);
  const [changingUser, setChangingUser] = useState(false);
  const [userCard, setUserCard] = useState({ reveal: false });
  const [fetchingUser, setFetchingUser] = useState(false);
  const tweetsRef = useRef(null);
  const lastUpdate = useRef(0);
  const timelineTimeoutId = useRef(0);
  const hoveringOverHandle = useRef(false);
  const userCardEnterTimeoutId = useRef(0);
  const userCardLeaveTimeoutId = useRef(0);

  useEffect(() => {
    if (hasUsers()) {
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
        setUsers([...addUser(user)]);
        setActiveUser({ ...getActiveUser() });

        if (addingAnotherUser) {
          setAddingAnotherUser(false);
        }
      }
    } catch (e) {
      console.log(e);
    } finally {
      if (loading) {
        setLoading(false);
      }
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

  function viewNewTweets() {
    setTweets(tweetsToLoad.concat(tweets));
    setTweetsToLoad([]);
  }

  async function logout() {
    const hasMoreUsers = removeActiveUser();

    if (hasMoreUsers) {
      setChangingUser(true);
      await loadContent();
      setChangingUser(false);
    }
    else {
      setUser(null);
      setTweets([]);
      setTweetsToLoad([]);
    }
  }

  async function selectUser(user, index) {
    if (user.active) {
      return;
    }
    tweetsToLoad.length = 0;

    setChangingUser(true);
    setTweetsToLoad([]);
    updateActiveUser(index);
    await loadContent();
    tweetsRef.current.scrollTo(0, 0);
    setChangingUser(false);
  }

  function addAnotherUser() {
    setAddingAnotherUser(true);
  }

  function hideAnotherUserForm() {
    setAddingAnotherUser(false);
  }

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

  function showUserCard(element, user, isQuotedTweet) {
    clearTimeout(userCardEnterTimeoutId.current);

    if (element === userCard.element) {
      clearTimeout(userCardLeaveTimeoutId.current);
    }
    else {
      userCardEnterTimeoutId.current = setTimeout(() => {
        setUserCard({
          ...user,
          element,
          reveal: true,
          isQuotedTweet,
          data: {
            handle: {
              top: element.offsetTop - 4,
              left: element.offsetLeft - 4,
              right: element.offsetLeft + element.offsetWidth + 4,
              bottom: element.offsetTop + element.offsetHeight + 4
            },
            container: {
              scrollTop: tweetsRef.current.scrollTop,
              width: tweetsRef.current.clientWidth,
              height: tweetsRef.current.scrollTop + tweetsRef.current.clientHeight
            }
          }
        });
      }, 1000);
    }
  }

  function handleTweetUserPointerEnter(event, user, isQuotedTweet) {
    showUserCard(event.currentTarget, user, isQuotedTweet);
  }

  function handleTweetPointerLeave() {
    hoveringOverHandle.current = false;
    clearTimeout(userCardEnterTimeoutId.current);

    userCardLeaveTimeoutId.current = setTimeout(() => {
      setUserCard({ reveal: false });
    }, 1000);
  }

  function handleUserCardPointerEnter() {
    clearTimeout(userCardLeaveTimeoutId.current);
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

  if (loading || !user || addingAnotherUser) {
    return <Form initialLoading={loading} loadContent={loadContent} addingAnotherUser={addingAnotherUser} hide={hideAnotherUserForm}/>;
  }
  return (
    <div className="twitter-content" style={{ "--profile-color": user.profileColor }}>
      <div className="main-panel-item-header">
        <a href={user.homepage} className="twitter-user" target="_blank" rel="noreferrer">
          <img src={user.profileImage} className="twitter-user-image" alt=""/>
          <span className="twitter-user-name">{user.name}</span>
          <span className="twitter-user-handle">{user.handle}</span>
        </a>
        {users && (
          <Dropdown
            toggle={{ className: "main-panel-item-header-btn" }}
            body={{ className: "twitter-header-dropdown" }}>
            <div className="dropdown-group">
              {users.map((user, i) => (
                <button className="btn icon-text-btn dropdown-btn twitter-header-dropdown-user"
                  onClick={() => selectUser(user, i)} disabled={user.active} key={i}>
                  <img src={user.profileImage} className="twitter-header-dropdown-user-image" width="48px" height="48px" alt=""/>
                  <div>
                    <div>{user.name}</div>
                    <div className="twitter-header-dropdown-user-handle">{user.handle}</div>
                  </div>
                  {user.active && (
                    <div className="twitter-header-dropdown-user-indicator"></div>
                  )}
                </button>
              ))}
            </div>
            <button className="btn icon-text-btn dropdown-btn" onClick={addAnotherUser}>
              <Icon id="plus"/>
              <span>Add another account</span>
            </button>
            <button className="btn icon-text-btn dropdown-btn" onClick={logout}>
              <Icon id="logout"/>
              <span>Log out {activeUser.handle}</span>
            </button>
          </Dropdown>
        )}
      </div>
      <ul className={`tweets${tweetsToLoad.length > 0 && tweetsRef.current.scrollTop > 0 ? " tweet-indicator" : ""}`} ref={tweetsRef}>
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
        {userCard.reveal && (
          <UserCard userCard={userCard} handlePointerEnter={handleUserCardPointerEnter} handlePointerLeave={handleTweetPointerLeave}/>
        )}
      </ul>
      <ToTop/>
      {changingUser && (
        <div className="twitter-content-mask">
          <Spinner/>
        </div>
      )}
    </div>
  );
}
