import { useState, useEffect, useRef, lazy, Suspense } from "react";
import * as chromeStorage from "services/chromeStorage";
import * as feedService from "services/feeds";
import Icon from "components/Icon";
import "./rss-feed.css";

const Form = lazy(() => import("./Form"));
const Feeds = lazy(() => import("./Feeds"));
const Entries = lazy(() => import("./Entries"));

export default function RssFeed({ locale, showIndicator }) {
  const [loading, setLoading] = useState(true);
  const [activeComponent, setActiveComponent] = useState(null);
  const [feeds, setFeeds] = useState(() => getDefaultFeeds());
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

    if (feeds.active.length || feeds.failed.length) {
      scheduleFeedUpdate();
    }
    return () => {
      clearTimeout(timeoutId.current);
    };
  }, [loading, feeds]);

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
      if (!feeds) {
        return;
      }

      if (feeds.newValue) {
        syncFeeds(feeds.newValue);
      }
      else {
        updatedFeeds.current.length = 0;

        showForm();
        setNavigation({ VISIBLE_ITEM_COUNT : 3, activeIndex: 0, shift: 0 });
        setFeeds(getDefaultFeeds());
      }
    });
  }

  function getDefaultFeeds() {
    return {
      active: [],
      inactive: [],
      failed: []
    };
  }

  async function syncFeeds(newFeeds) {
    const length = Math.max(newFeeds.active.length, feeds.active.length);
    feeds.inactive = newFeeds.inactive;

    for (let i = 0; i < length; i++) {
      const oldFeed = feeds.active[i];
      const newFeed = newFeeds.active[i];

      if (newFeed) {
        const match = feeds.active.find(({ url }) => newFeed.url === url);

        if (!match) {
          try {
            const data = await feedService.fetchFeed(newFeed);

            if (data.url) {
              feeds.active.push(data);
            }
            else {
              feeds.failed.push(newFeed);
            }
          } catch (e) {
            console.log(e);
            feeds.failed.push(newFeed);
          }
        }
        else if (match.title !== newFeed.title) {
          match.title = newFeed.title;
        }
      }

      if (oldFeed && !newFeeds.active.some(({ url }) => oldFeed.url === url)) {
        removeFeed(i, "active", false);
      }
    }
    setFeeds({ ...feeds });
  }

  async function initFeeds() {
    const feedsToLoad = await feedService.getStoredFeeds();

    if (feedsToLoad) {
      const feeds = {};
      let feedsArray = [];

      if (Array.isArray(feedsToLoad)) {
        feedsArray = feedsToLoad;
        feeds.inactive = [];
      }
      else {
        feedsArray = feedsToLoad.active;
        feeds.inactive = feedsToLoad.inactive;
      }
      const { active, failed } = await fetchInitialFeeds(feedsArray);

      feeds.active = active;
      feeds.failed = failed;

      if (!feeds.active.length) {
        if (feeds.inactive.length || feeds.failed.length) {
          showFeedList();
        }
        else {
          showForm();
        }
      }
      setFeeds(feeds);
    }
    else {
      showForm();
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
        if (status === "fulfilled" && value?.entries) {
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
    return { active: feeds, failed: failedFeeds };
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
    for (const [index, feed] of feeds.active.entries()) {
      await updateFeed(feed, index);
    }

    if (feeds.failed.length) {
      let failedFeeds = feeds.failed;

      for (const feed of feeds.failed) {
        const data = await feedService.fetchFeed(feed);

        if (!data.message) {
          failedFeeds = failedFeeds.filter(({ url }) => url !== feed.url);
          feeds.active.splice(feed.index, 0, data);
        }
      }
      feeds.failed = failedFeeds;
    }
    setFeeds({ ...feeds });
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
      animateLeft = feeds.active.slice(0, shift).some(({ newEntryCount }) => newEntryCount > 0);
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
      animateRight = feeds.active.slice(shift + navigation.VISIBLE_ITEM_COUNT).some(({ newEntryCount }) => newEntryCount > 0);
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
      markEntriesAsRead(feeds.active[index]);
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
      markEntriesAsRead(feeds.active[index]);
      return;
    }
    let { shift } = navigation;

    if (index < shift || index >= shift + navigation.VISIBLE_ITEM_COUNT) {
      shift = index > feeds.active.length - navigation.VISIBLE_ITEM_COUNT ? feeds.active.length - navigation.VISIBLE_ITEM_COUNT : index;
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

    setFeeds({ ...feeds });
  }

  function markEntryAsRead(entry) {
    if (entry.newEntry) {
      feeds.active[navigation.activeIndex].newEntryCount -= 1;
      entry.newEntry = false;
      setFeeds({ ...feeds });
    }
  }

  function expandEntry(entry) {
    entry.truncated = false;
    setFeeds({ ...feeds });
  }

  function updateFeeds(feeds, save = true) {
    setFeeds({ ...feeds });

    if (save) {
      saveFeeds(feeds);
    }
  }

  function removeFeed(index, type, save = true) {
    feeds[type].splice(index, 1);

    if (type === "active" && feeds.active.length) {
      setNavigation({
        ...navigation,
        activeIndex: 0,
        shift: 0
      });
    }

    if (!feeds.active.length) {
      if (feeds.inactive.length || feeds.failed.length) {
        showFeedList();
      }
      else {
        showForm();
      }
    }
    updateFeeds(feeds, save);
  }

  function addFeed(feed) {
    feeds.active.push(feed);
    setNavigation({
      ...navigation,
      activeIndex: feeds.active.length - 1,
      shift: feeds.active.length - navigation.VISIBLE_ITEM_COUNT < 0 ? 0 : feeds.active.length - navigation.VISIBLE_ITEM_COUNT
    });
    setActiveComponent(null);
    updateFeeds(feeds);
  }

  function deactivateFeed(index) {
    const [feed] = feeds.active.splice(index, 1);

    feeds.inactive.push(feed);

    if (feeds.active.length) {
      setNavigation({
        ...navigation,
        activeIndex: 0,
        shift: 0
      });
    }
    updateFeeds(feeds);
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

  function saveFeeds(feeds) {
    chromeStorage.set({
      feeds: {
        active: feeds.active.concat(feeds.failed).map(({ url, title }) => ({ url, title })),
        inactive: feeds.inactive.map(feed => {
          delete feed.fetching;
          delete feed.entries;
          delete feed.newEntryCount;
          return feed;
        })
      }
    });
  }

  if (loading) {
    return <Icon id="rss" className="main-panel-item-splash-icon"/>;
  }
  else if (activeComponent) {
    return (
      <Suspense fallback={null}>
        {activeComponent === "feeds" && (
          <Feeds feeds={feeds} locale={locale} selectFeedFromList={selectFeedFromList}
            removeFeed={removeFeed} deactivateFeed={deactivateFeed}
            updateFeeds={updateFeeds} showForm={showForm} hide={hideFeedList}/>
        )}
        {activeComponent === "form" && <Form feeds={feeds} locale={locale} addFeed={addFeed} hide={hideForm}/>}
      </Suspense>
    );
  }
  return (
    <Suspense fallback={null}>
      <Entries navigation={navigation} feeds={feeds}
        locale={locale} selectFeed={selectFeed} previousShift={previousShift} nextShift={nextShift}
        showFeedList={showFeedList} markEntryAsRead={markEntryAsRead} expandEntry={expandEntry}/>
    </Suspense>
  );
}
