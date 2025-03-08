import { useState, useEffect, useRef, lazy, Suspense } from "react";
import * as twitterService from "services/twitter";
import ToTop from "components/ToTop";
import Icon from "components/Icon";
import Spinner from "components/Spinner";
import "./twitter.css";
import Form from "./Form";
import UserSelectDropdown from "./UserSelectDropdown";
import UserCard from "./UserCard";
import Tweet from "./Tweet";

const Settings = lazy(() => import("./Settings"));
const Timelines = lazy(() => import("./Timelines"));

export default function Twitter({ showIndicator }) {
  const [loading, setLoading] = useState(true);
  const [addingAnotherUser, setAddingAnotherUser] = useState(false);
  const [timelines, setTimelines] = useState(() => {
    const users = twitterService.getUsers();
    const timelines = users.reduce((timelines, user) => {
      if (user.active) {
        timelines.push({
          user,
          tweets: [],
          tweetsToLoad: []
        });
      }
      return timelines;

    }, []);

    if (timelines.length === 0 && users.length > 1) {
      timelines.push({
        user: users[0],
        tweets: [],
        tweetsToLoad: []
      });
    }
    return timelines;
  });
  const [selectedTimelineIndex, setSelectedTimelineIndex] = useState(() => {
    const user = twitterService.getSelectedUser();
    const index = timelines.findIndex(timeline => timeline.user.handle === user.handle);

    return index < 0 ? 0 : index;
  });
  const [fetchingMoreTweets, setFetchingMoreTweets] = useState(false);
  const [changingUser, setChangingUser] = useState(false);
  const [userCard, setUserCard] = useState({ reveal: false });
  const [settings, setSettings] = useState(() => ({
    videoQuality: "high",
    videoVolume: 0.5,
    ...JSON.parse(localStorage.getItem("twitter-settings"))
  }));
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [timelinesVisible, setTimelinesVisible] = useState(false);
  const tweetsRef = useRef(null);
  const lastUpdate = useRef(0);
  const timelineTimeoutId = useRef(0);
  const userCardEnterTimeoutId = useRef(0);
  const userCardLeaveTimeoutId = useRef(0);

  const selectedTimeline = timelines[selectedTimelineIndex];

  useEffect(() => {
    if (twitterService.hasUsers()) {
      loadTimelines();
    }
    else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (timelines.some(timeline => timeline.tweets.length > 0)) {
      scheduleTimelineUpdate();
    }
    return () => {
      clearTimeout(timelineTimeoutId.current);
    };
  }, [loading, timelines]);

  async function loadTimelines() {
    for (const timeline of timelines) {
      try {
        const { user, tweets } = await fetchUserAndTweets(timeline.user);

        if (user && tweets) {
          timeline.user = user;
          timeline.tweets = tweets;

          twitterService.updateUser(timeline.user.handle, user);
        }
      } catch (e) {
        console.log(e);
      }
    }

    setTimelines([...timelines]);

    if (loading) {
      setLoading(false);
    }
  }

  async function fetchUserAndTweets(user) {
    const [fetchedUser, fetchedTimeline] = await Promise.all([twitterService.fetchUser(user), twitterService.fetchTimeline(user)]);

    if (fetchedUser && fetchedTimeline) {
      if (fetchedUser.statusCode) {
        return {
          user,
          tweets: []
        };
      }
      lastUpdate.current = Date.now();

      return {
        user: { ...user, ...fetchedUser },
        tweets: fetchedTimeline.tweets
      };
    }
    return {
      user,
      tweets: []
    };
  }

  async function addAnotherUser() {
    try {
      const { user, tweets } = await fetchUserAndTweets();

      if (user && tweets) {
        twitterService.addUser(user);

        if (timelines.length) {
          timelines.splice(selectedTimelineIndex, 1, {
            user,
            tweets,
            tweetsToLoad: []
          });
          setTimelines([...timelines]);
        }
        else {
          setTimelines([{
            user,
            tweets,
            tweetsToLoad: []
          }]);
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
        updateTimelines();
      }
      else {
        updateTweetTime();
      }
    }, 60000);
  }

  async function updateTimelines() {
    let updated = false;

    for (const timeline of timelines) {
      const lastTweetId = timeline.tweets[timeline.tweets.length - 1].id;
      const fetchedTimeline = await twitterService.fetchTimeline(timeline.user, { since_id: lastTweetId });

      if (fetchedTimeline) {
        const currentTweets = timeline.tweetsToLoad.concat(timeline.tweets);
        const newTweets = [];

        for (const tweet of fetchedTimeline.tweets) {
          const foundTweet = currentTweets.find(({ id }) => tweet.id === id);

          if (foundTweet) {
            foundTweet.retweetCount = tweet.retweetCount;
            foundTweet.likeCount = tweet.likeCount;
            foundTweet.date = twitterService.getTweetDate(foundTweet.date.createdAt);
          }
          else {
            newTweets.push(tweet);
          }
        }

        if (newTweets.length) {
          timeline.tweetsToLoad.push(...newTweets);
          showIndicator("twitter");
        }
        updated = true;
      }
    }

    if (updated) {
      setTimelines([...timelines]);
    }
    else {
      scheduleTimelineUpdate();
    }
  }

  function updateTweetTime() {
    for (const timeline of timelines) {
      timeline.tweets.forEach(tweet => {
        tweet.date = twitterService.getTweetDate(tweet.date.createdAt);
      });
      timeline.tweetsToLoad.forEach(tweet => {
        tweet.date = twitterService.getTweetDate(tweet.date.createdAt);
      });
    }
    setTimelines([...timelines]);
  }

  async function fetchMoreTweets() {
    if (fetchingMoreTweets) {
      return;
    }
    setFetchingMoreTweets(true);

    const { id } = selectedTimeline.tweets[selectedTimeline.tweets.length - 1];
    const timeline = await twitterService.fetchTimeline(selectedTimeline.user, { max_id: id });

    if (timeline) {
      const newTweets = timeline.tweets.filter(tweet => tweet.id !== id);

      if (newTweets.length) {
        selectedTimeline.tweets = selectedTimeline.tweets.concat(newTweets);
        setTimelines([...timelines]);
      }
    }
    setFetchingMoreTweets(false);
  }

  function viewNewTweets() {
    selectedTimeline.tweets = selectedTimeline.tweetsToLoad.concat(selectedTimeline.tweets);
    selectedTimeline.tweetsToLoad.length = 0;

    setTimelines([...timelines]);
  }

  async function logout() {
    const hasMoreUsers = twitterService.removeSelectedUser();

    if (hasMoreUsers) {
      if (timelines.length > 1) {
        timelines.splice(selectedTimelineIndex, 1);
        setSelectedTimelineIndex(0);
      }
      else {
        setChangingUser(true);

        const selectedUser = twitterService.getSelectedUser();
        const { user, tweets } = await fetchUserAndTweets(selectedUser);

        timelines.splice(selectedTimelineIndex, 1, {
          user,
          tweets,
          tweetsToLoad: []
        });
        setChangingUser(false);
      }
    }
    else {
      setTimelines([]);
      setSelectedTimelineIndex(0);
    }
  }

  async function selectUser(userToSelect) {
    if (userToSelect.selected) {
      return;
    }
    const activeTimelineIndex = timelines.findIndex(timeline => userToSelect.handle === timeline.user.handle);

    if (activeTimelineIndex >= 0) {
      deactiveMedia();
      setSelectedTimelineIndex(activeTimelineIndex);
      twitterService.markUserAsSelected(userToSelect, true);
      tweetsRef.current.scrollTo(0, 0);
    }
    else {
      try {
        setChangingUser(true);

        const { user, tweets } = await fetchUserAndTweets(userToSelect);

        timelines.splice(selectedTimelineIndex, 1, {
          user,
          tweets,
          tweetsToLoad: []
        });

        setChangingUser(false);
        setTimelines([...timelines]);
        twitterService.markUserAsSelected(userToSelect);
        tweetsRef.current.scrollTo(0, 0);
      } catch (e) {
        console.log(e);
      }
    }
  }

  function showAnotherUserForm() {
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

  function deactiveMedia() {
    let modified = false;

    for (const tweet of selectedTimeline.tweets) {
      if (tweet.media.length) {
        const [mediaItem] = tweet.media;

        if (mediaItem.active) {
          delete mediaItem.active;
          modified = true;
        }
      }

      if (tweet.quotedTweet?.media.length) {
        const [mediaItem] = tweet.quotedTweet.media;

        if (mediaItem.active) {
          delete mediaItem.active;
          modified = true;
        }
      }
    }

    if (modified) {
      setTimelines([...timelines]);
    }
  }

  function activateMedia(media) {
    media.active = true;
    setTimelines([...timelines]);
  }

  function updateSetting(setting, value) {
    if (setting === "highlightColor") {
      setUserHighlightColor(value);
    }
    else {
      const updatedSettings = { ...settings, [setting]: value };

      setSettings(updatedSettings);
      localStorage.setItem("twitter-settings", JSON.stringify(updatedSettings));
    }
  }

  function setUserHighlightColor(color) {
    selectedTimeline.user.highlightColor = color;

    setTimelines([...timelines]);
    twitterService.updateUserHighlightColor(color, selectedTimeline.user.handle);
  }

  function openSettings() {
    setSettingsOpened(true);
  }

  function hideSettings() {
    setSettingsOpened(false);
  }

  function showTimelines() {
    setTimelinesVisible(true);
  }

  function hideTimelines() {
    setTimelinesVisible(false);
  }

  async function addTimeline(user) {
    if (user.active || timelines.length >= 2) {
      return;
    }
    setChangingUser(true);
    setTimelinesVisible(false);

    const timeline = await fetchUserAndTweets(user);

    if (timelines.length === 1) {
      timelines.push({
        user: timeline.user,
        tweets: timeline.tweets,
        tweetsToLoad: []
      });
      setSelectedTimelineIndex(timelines.length - 1);
      twitterService.markUserAsSelected(user, true);
    }
    else {
      timelines.splice(selectedTimelineIndex, 1, {
        user: timeline.user,
        tweets: timeline.tweets,
        tweetsToLoad: []
      });
      twitterService.markUserAsSelected(user);
    }
    setTimelines([...timelines]);
    setChangingUser(false);
    tweetsRef.current.scrollTo(0, 0);
  }

  function removeTimeline(handle) {
    const index = timelines.findIndex(timeline => timeline.user.handle === handle);

    twitterService.removeActiveUserProp(timelines[index].user.handle);
    timelines.splice(index, 1);
    setSelectedTimelineIndex(0);
    setTimelines([...timelines]);
    twitterService.markUserAsSelected(timelines[0].user);
    tweetsRef.current.scrollTo(0, 0);
  }

  function switchTimeline(user, index) {
    deactiveMedia();
    setSelectedTimelineIndex(index);
    twitterService.markUserAsSelected(user, true);
    tweetsRef.current.scrollTo(0, 0);
  }

  function renderSwitchTimelineButton() {
    const secondTimelineIndex = selectedTimelineIndex === 0 ? 1 : 0;
    const secondTimeline = timelines[secondTimelineIndex];

    return (
      <button className="btn icon-text-btn twitter-second-user" onClick={() => switchTimeline(secondTimeline.user, secondTimelineIndex)} title={`Switch to ${secondTimeline.user.name}`}>
        <img src={secondTimeline.user.profileImage} className="twitter-user-image" alt=""/>
        <div className="twitter-second-user-name-handle">
          <span className="twitter-user-name">{secondTimeline.user.name}</span>
          <span className="twitter-user-handle">{secondTimeline.user.handle}</span>
        </div>
        {secondTimeline.tweetsToLoad.length ? (
          <span className="twitter-second-user-tweet-indicator">{secondTimeline.tweetsToLoad.length}</span>
        ) : null}
      </button>
    );
  }

  if (loading || !selectedTimeline?.user || addingAnotherUser) {
    return <Form initialLoading={loading} loadContent={addAnotherUser} addingAnotherUser={addingAnotherUser} hide={hideAnotherUserForm}/>;
  }
  return (
    <div className="twitter-content" style={{ "--highlight-color": selectedTimeline.user.highlightColor || selectedTimeline.user.profileColor }}>
      <div className="main-panel-item-header twitter-header">
        <div className="twitter-user-container">
          <a href={selectedTimeline.user.homepage} className="twitter-user" target="_blank" rel="noreferrer">
            <img src={selectedTimeline.user.profileImage} className="twitter-user-image" alt=""/>
            <span className="twitter-user-name">{selectedTimeline.user.name}</span>
            <span className="twitter-user-handle">{selectedTimeline.user.handle}</span>
          </a>
        </div>
        {timelines.length > 1 ? renderSwitchTimelineButton() : null}
        <button className="btn icon-btn twitter-header-btn" onClick={openSettings} title="Settings">
          <Icon id="settings"/>
        </button>
        <UserSelectDropdown selectUser={selectUser} showTimelines={showTimelines} showAnotherUserForm={showAnotherUserForm} logout={logout}/>
      </div>
      <ul className={`tweets${selectedTimeline.tweetsToLoad.length > 0 && tweetsRef.current.scrollTop > 0 ? " tweet-indicator" : ""}`} ref={tweetsRef}>
        {selectedTimeline.tweetsToLoad.length > 0 && (
          <li>
            <button className="btn text-btn new-tweet-btn" onClick={viewNewTweets}>View {selectedTimeline.tweetsToLoad.length} new tweet{selectedTimeline.tweetsToLoad.length > 1 ? "s": ""}</button>
          </li>
        )}
        {selectedTimeline.tweets.map(tweet => (
          <Tweet tweet={tweet} settings={settings} activateMedia={activateMedia}
            showUserCard={showUserCard} handleTweetPointerLeave={handleTweetPointerLeave} key={tweet.id}/>
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
      <Suspense fallback={null}>
        {settingsOpened && (
          <Settings settings={settings} user={selectedTimeline.user} updateSetting={updateSetting} hide={hideSettings}/>
        )}
      </Suspense>
      <Suspense fallback={null}>
        {timelinesVisible && <Timelines addTimeline={addTimeline} removeTimeline={removeTimeline} hide={hideTimelines}/>}
      </Suspense>
      {changingUser && (
        <div className="twitter-content-mask">
          <Spinner className="twitter-content-mask-spinner"/>
        </div>
      )}
    </div>
  );
}
