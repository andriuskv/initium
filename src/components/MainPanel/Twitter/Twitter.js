import { useState, useEffect, useRef } from "react";
import { hasUsers, addUser, updateActiveUser, getActiveUser, removeActiveUser, fetchUser, fetchTimeline, getTweetDate } from "services/twitter";
import ToTop from "components/ToTop";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import Spinner from "components/Spinner";
import "./twitter.css";
import Form from "./Form";
import Settings from "./Settings";
import UserCard from "./UserCard";
import Tweet from "./Tweet";

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
  const [hightlightColor, setHightlightColor] = useState(() => localStorage.getItem("twitter-highlight-color"));
  const [settingsOpened, setSettingsOpened] = useState(false);
  const tweetsRef = useRef(null);
  const lastUpdate = useRef(0);
  const timelineTimeoutId = useRef(0);
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

        if (!hightlightColor) {
          setHightlightColor(user.profileColor);
        }

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

  function handleTweetPointerLeave() {
    clearTimeout(userCardEnterTimeoutId.current);

    userCardLeaveTimeoutId.current = setTimeout(() => {
      setUserCard({ reveal: false });
    }, 1000);
  }

  function handleUserCardPointerEnter() {
    clearTimeout(userCardLeaveTimeoutId.current);
  }

  function activateMedia(media) {
    media.active = true;
    setTweets([...tweets]);
  }

  function updateHighlightColor(color) {
    setHightlightColor(color);
  }

  function openSettings() {
    setSettingsOpened(true);
  }

  function hideSettings() {
    setSettingsOpened(false);
  }

  if (loading || !user || addingAnotherUser) {
    return <Form initialLoading={loading} loadContent={loadContent} addingAnotherUser={addingAnotherUser} hide={hideAnotherUserForm}/>;
  }
  return (
    <div className="twitter-content" style={{ "--highlight-color": hightlightColor }}>
      <div className="main-panel-item-header twitter-header">
        <a href={user.homepage} className="twitter-user" target="_blank" rel="noreferrer">
          <img src={user.profileImage} className="twitter-user-image" alt=""/>
          <span className="twitter-user-name">{user.name}</span>
          <span className="twitter-user-handle">{user.handle}</span>
        </a>
        <button className="btn icon-btn twitter-header-btn" onClick={openSettings} title="Settings">
          <Icon id="settings"/>
        </button>
        {users && (
          <Dropdown
            container={{ className: "twitter-header-btn" }}
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
          <Tweet tweet={tweet} key={tweet.id} activateMedia={activateMedia} showUserCard={showUserCard} handleTweetPointerLeave={handleTweetPointerLeave}/>
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
      {settingsOpened && (
        <Settings defaultColor={user.profileColor} updateHighlightColor={updateHighlightColor} hide={hideSettings}/>
      )}
      {changingUser && (
        <div className="twitter-content-mask">
          <Spinner/>
        </div>
      )}
    </div>
  );
}
