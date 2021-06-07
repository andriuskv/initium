import { useState, useEffect, useRef, lazy, Suspense } from "react";
import * as chromeStorage from "services/chromeStorage";
import * as feedService from "services/feeds";
import Icon from "components/Icon";
import "./rss-feed.css";

const Form = lazy(() => import("./Form"));
const Feeds = lazy(() => import("./Feeds"));
const Entries = lazy(() => import("./Entries"));

export default function RssFeed({ showIndicator }) {
  const [loading, setLoading] = useState(true);
  const [activeComponent, setActiveComponent] = useState(null);
  const [feeds, setFeeds] = useState([]);
  const [feedsToLoad, setFeedsToLoad] = useState([]);
  const [navigation, setNavigation] = useState(() => ({
    VISIBLE_ITEM_COUNT : 3,
    activeIndex: 0,
    shift: 0,
    animateLeft: false,
    animateRight: false
  }));
  const updatedFeeds = useRef([]);
  const lastUpdate = useRef(0);
  const timeoutId = useRef(0);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (feeds.length || feedsToLoad.length) {
      scheduleFeedUpdate();
    }
    return () => {
      clearTimeout(timeoutId.current);
    };
  }, [loading, feeds, feedsToLoad]);

  useEffect(() => {
    if (updatedFeeds.current.length) {
      if (!activeComponent) {
        animateNavigation();
      }
      updatedFeeds.current.length = 0;
      showIndicator("rssFeed");
    }
  }, [navigation, feeds]);

  function init() {
    initFeeds();

    chromeStorage.subscribeToChanges(({ feeds }) => {
      if (feeds) {
        syncFeeds(feeds.newValue);
      }
    });
  }

  async function syncFeeds(newFeeds) {
    const length = Math.max(newFeeds.length, feeds.length);

    for (let i = 0; i < length; i++) {
      const oldFeed = feeds[i];
      const newFeed = newFeeds[i];

      if (newFeed) {
        const match = feeds.find(({ url }) => newFeed.url === url);

        if (!match) {
          try {
            const data = await feedService.fetchFeed(newFeed);

            if (data.url) {
              feeds.push(data);
            }
          } catch (e) {
            console.log(e);
            feedsToLoad.push(newFeed);
          }
        }
        else if (match.title !== newFeed.title) {
          match.title = newFeed.title;
        }
      }

      if (oldFeed && !newFeeds.some(({ url }) => oldFeed.url === url)) {
        removeFeed(i, false);
      }
    }
    setFeeds([...feeds]);
    setFeedsToLoad([...feedsToLoad]);
  }

  async function initFeeds() {
    const feedsToLoad = await feedService.getStoredFeeds();

    if (feedsToLoad.length) {
      const { feeds, failedFeeds } = await fetchInitialFeeds(feedsToLoad);

      if (feeds.length) {
        setFeeds(feeds);
      }
      else if (failedFeeds.length) {
        setActiveComponent("feeds");
      }
      setFeedsToLoad(failedFeeds);
    }
    else {
      setActiveComponent("form");
    }
    lastUpdate.current = Date.now();
    setLoading(false);
  }

  async function fetchInitialFeeds(feedsToLoad) {
    const promises = feedsToLoad.map(feed => feedService.fetchFeed(feed));
    const feeds = [];
    const failedFeeds = [];

    try {
      const results = await Promise.allSettled(promises);

      for (const [index, { status, value }] of results.entries()) {
        if (status === "fulfilled") {
          feeds.push(value);
        }
        else {
          failedFeeds.push({
            ...feedsToLoad[index],
            // Keep index to know where to put the feed on successful refetch.
            index
          });
        }
      }
    } catch (e) {
      console.log(e);
    }
    return { feeds, failedFeeds };
  }

  function scheduleFeedUpdate() {
    timeoutId.current = window.setTimeout(() => {
      const currentDate = Date.now();

      if (currentDate - lastUpdate.current > 1200000) {
        lastUpdate.current = currentDate;
        refetchFeeds();
      }
      else {
        scheduleFeedUpdate();
      }
    }, 60000);
  }

  async function refetchFeeds() {
    for (const [index, feed] of feeds.entries()) {
      await updateFeed(feed, index);
    }

    if (feedsToLoad.length) {
      let failedFeeds = feedsToLoad;

      for (const feed of feedsToLoad) {
        const data = await feedService.fetchFeed(feed);

        if (!data.message) {
          failedFeeds = failedFeeds.filter(({ url }) => url !== feed.url);
          feeds.splice(feed.index, 0, data);
        }
      }

      if (failedFeeds.length !== feedsToLoad.length) {
        setFeedsToLoad([...failedFeeds]);
      }
    }
    setFeeds([...feeds]);
  }

  async function updateFeed(feed, index) {
    try {
      const newFeed = await feedService.updateFeed(feed);

      if (!newFeed) {
        return;
      }
      const { length } = newFeed.entries;

      if (length) {
        feed.newEntryCount = newFeed.newEntryCount;
        feed.entries = newFeed.entries.concat(feed.entries);
        updatedFeeds.current.push(index);
      }

      if (newFeed.updated) {
        feed.updated = newFeed.updated;
      }
    } catch (e) {
      console.log(e);
    }
  }

  function previousShift() {
    const index = navigation.activeIndex;
    const shift = navigation.shift - 1;
    let animateLeft = navigation.animateLeft;

    if (animateLeft) {
      animateLeft = feeds.slice(0, shift).some(({ newEntryCount }) => newEntryCount > 0);
    }
    setNavigation({
      ...navigation,
      activeIndex: index >= shift + navigation.VISIBLE_ITEM_COUNT ? index - 1 : index,
      shift,
      animateLeft
    });
  }

  function nextShift() {
    const index = navigation.activeIndex;
    const shift = navigation.shift + 1;
    let animateRight = navigation.animateRight;

    if (animateRight) {
      animateRight = feeds.slice(shift + navigation.VISIBLE_ITEM_COUNT).some(({ newEntryCount }) => newEntryCount > 0);
    }
    setNavigation({
      ...navigation,
      activeIndex: index < shift ? index + 1 : index,
      shift,
      animateRight
    });
  }

  function selectFeed(element, index, container) {
    if (element.closest("[data-entry-count]")) {
      markEntriesAsRead(feeds[index]);
    }
    else {
      container.scrollTop = 0;

      setNavigation({
        ...navigation,
        activeIndex: index
      });
    }
  }

  function selectFeedFromList({ target }, index) {
    if (target.closest("[data-entry-count]")) {
      markEntriesAsRead(feeds[index]);
      return;
    }
    let { shift } = navigation;

    if (index < shift || index >= shift + navigation.VISIBLE_ITEM_COUNT) {
      shift = index > feeds.length - navigation.VISIBLE_ITEM_COUNT ? feeds.length - navigation.VISIBLE_ITEM_COUNT : index;
    }
    setNavigation({
      ...navigation,
      activeIndex: index,
      shift
    });
    hideFeedList();
  }

  function animateNavigation() {
    let animateLeft = navigator.animateLeft;
    let animateRight = navigator.animateRight;

    for (const index of updatedFeeds.current) {
      if (index < navigation.shift) {
        animateLeft = true;
      }

      if (index >= navigation.shift + navigation.VISIBLE_ITEM_COUNT) {
        animateRight = true;
      }
    }

    if (animateLeft || animateRight) {
      setNavigation({
        ...navigation,
        animateLeft,
        animateRight
      });
    }
  }

  function markEntriesAsRead(feed) {
    feed.newEntryCount = 0;
    feed.entries = feed.entries.map(entry => {
      entry.newEntry = false;
      return entry;
    });

    setFeeds([...feeds]);
  }

  function markEntryAsRead(entry) {
    if (entry.newEntry) {
      feeds[navigation.activeIndex].newEntryCount -= 1;
      entry.newEntry = false;
      setFeeds([...feeds]);
    }
  }

  function expandEntry(entry) {
    entry.truncated = false;
    setFeeds([...feeds]);
  }

  function updateFeeds(feeds, feedsToLoad, save = true) {
    setFeeds([...feeds]);
    setFeedsToLoad([...feedsToLoad]);

    if (save) {
      saveFeeds(feeds, feedsToLoad);
    }
  }

  function removeFeed(index, save = true) {
    feeds.splice(index, 1);

    if (feeds.length) {
      setNavigation({
        ...navigation,
        activeIndex: 0,
        shift: 0
      });
    }
    else {
      showForm();
    }
    updateFeeds(feeds, feedsToLoad, save);
  }

  function addFeed(feed) {
    feeds.push(feed);
    setFeeds([...feeds]);
    setNavigation({
      ...navigation,
      activeIndex: feeds.length - 1,
      shift: feeds.length - navigation.VISIBLE_ITEM_COUNT < 0 ? 0 : feeds.length - navigation.VISIBLE_ITEM_COUNT
    });
    setActiveComponent(null);
    saveFeeds(feeds, feedsToLoad);
  }

  function showForm() {
    setActiveComponent("form");
  }

  function hideForm() {
    setActiveComponent("feeds");
  }

  function showFeedList() {
    setActiveComponent("feeds");

    if (navigation.animateLeft || navigation.animateRight) {
      delete navigation.animateLeft;
      delete navigation.animateRight;
      setNavigation({ ...navigation });
    }
  }

  function hideFeedList() {
    setActiveComponent(null);
  }

  function saveFeeds(feeds, feedsToLoad) {
    chromeStorage.set({
      feeds: feeds.concat(feedsToLoad).map(({ url, title }) => ({ url, title }))
    });
  }

  if (loading) {
    return <Icon id="rss" className="main-panel-item-splash-icon"/>;
  }
  else if (activeComponent) {
    return (
      <Suspense fallback={null}>
        {activeComponent === "feeds" && (
          <Feeds feeds={feeds} feedsToLoad={feedsToLoad} selectFeedFromList={selectFeedFromList}
            removeFeed={removeFeed} updateFeeds={updateFeeds} showForm={showForm} hide={hideFeedList}/>
        )}
        {activeComponent === "form" && <Form feeds={feeds} feedsToLoad={feedsToLoad} addFeed={addFeed} hide={hideForm}/>}
      </Suspense>
    );
  }
  return (
    <Suspense fallback={null}>
      <Entries navigation={navigation} feeds={feeds} feedsToLoad={feedsToLoad}
        selectFeed={selectFeed} previousShift={previousShift} nextShift={nextShift}
        showFeedList={showFeedList} markEntryAsRead={markEntryAsRead} expandEntry={expandEntry}/>
    </Suspense>
  );
}
