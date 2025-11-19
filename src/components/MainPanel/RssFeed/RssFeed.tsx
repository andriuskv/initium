import type { Entry, FeedTypeName, FeedType, FailedFeedType, Feeds, Nav } from "types/feed";
import { useState, useEffect, useRef, lazy, Suspense, type MouseEvent } from "react";
import { getLocalStorageItem, timeout } from "utils";
import * as chromeStorage from "services/chromeStorage";
import * as feedService from "services/feeds";
import Icon from "components/Icon";
import Spinner from "components/Spinner";
import "./rss-feed.css";

const Form = lazy(() => import("./Form"));
const Feeds = lazy(() => import("./Feeds"));
const Entries = lazy(() => import("./Entries"));

const VISIBLE_ITEM_COUNT = 3;

type Props = {
  locale: any,
  showIndicator: (id: string) => void
}

function getDefaultFeeds() {
  return {
    active: [],
    inactive: [],
    failed: []
  };
}

export default function RssFeed({ locale, showIndicator }: Props) {
  const [loading, setLoading] = useState(true);
  const [activeComponent, setActiveComponent] = useState<"form" | "feeds" | "">("");
  const [feeds, setFeeds] = useState<Feeds>(() => getDefaultFeeds());
  const [navigation, setNavigation] = useState<Nav>(() => ({
    activeIndex: 0,
    shift: 0,
    animateLeft: false,
    animateRight: false
  }));
  const updatedFeeds = useRef<number[]>([]);
  const lastUpdate = useRef(0);
  const timeoutId = useRef(0);
  const saveTabTimeoutId = useRef(0);
  const first = useRef(true);

  function showForm() {
    setActiveComponent("form");
  }

  function showFeedList() {
    setActiveComponent("feeds");

    if (navigation.animateLeft || navigation.animateRight) {
      setNavigation({
        ...navigation,
        animateLeft: false,
        animateRight: false
      });
    }
  }

  useEffect(() => {
    async function fetchInitialFeeds(feedsToLoad: FeedType[]) {
      const promises = feedsToLoad.map(feed => feedService.fetchFeed(feed));
      const feeds: FeedType[] = [];
      const failedFeeds: FailedFeedType[] = [];

      try {
        const results = await Promise.allSettled(promises);

        for (const [index, item] of results.entries()) {
          if (item.status === "rejected" || "message" in item.value) {
            failedFeeds.push({
              ...feedsToLoad[index],
              // Keep index to know where to put the feed on successful refetch.
              index
            });
          }
          else {
            feeds.push(item.value);
          }
        }
      } catch (e) {
        console.log(e);
      }
      return { active: feeds, failed: failedFeeds };
    }

    async function initFeeds() {
      const feedsToLoad = await feedService.getStoredFeeds();

      if (feedsToLoad) {
        const feeds: Feeds = {
          active: [],
          inactive: feedsToLoad.inactive,
          failed: []
        };
        const { active, failed } = await fetchInitialFeeds(feedsToLoad.active);

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
        const saved = getLocalStorageItem<{ activeIndex: number, shift: number }>("active-feed-tab") || { activeIndex: 0, shift: 0 };

        if (saved.activeIndex < feeds.active.length) {
          setNavigation({ ...navigation, ...saved });
        }
        setFeeds(feeds);
      }
      else {
        showForm();
      }
      lastUpdate.current = new Date().getTime();
      setLoading(false);
    }

    async function syncFeeds(newFeeds: Feeds) {
      const length = Math.max(newFeeds.active.length, feeds.active.length);
      const active = [...feeds.active];
      const failed = [...feeds.failed];

      for (let i = 0; i < length; i++) {
        const oldFeed = active[i];
        const newFeed = newFeeds.active[i];

        if (newFeed) {
          const match = active.find(({ url }) => newFeed.url === url);

          if (!match) {
            try {
              const data = await feedService.fetchFeed(newFeed);

              if ("message" in data) {
                failed.push({
                  ...newFeed,
                  index: i
                });
              }
              else {
                active.push(data);
              }
            } catch (e) {
              console.log(e);
              failed.push({
                ...newFeed,
                index: i
              });
            }
          }
          else if (match.title !== newFeed.title) {
            match.title = newFeed.title;
          }
        }

        if (oldFeed && !newFeeds.active.some(({ url }) => oldFeed.url === url)) {
          active.splice(i, 1);
        }
      }

      setNavigation({ activeIndex: 0, shift: 0 });
      setFeeds({
        ...feeds,
        active,
        failed,
        inactive: newFeeds.inactive
      });

      if (active.length) {
        setActiveComponent("");
      }
      else if (newFeeds.inactive.length || failed.length) {
        setActiveComponent("feeds");
      }
      else {
        setActiveComponent("form");
      }
    }

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
          setNavigation({ activeIndex: 0, shift: 0 });
          setFeeds(getDefaultFeeds());
        }
      });
    }

    if (first.current) {
      init();
      first.current = false;
      return;
    }
  }, []);


  useEffect(() => {
    if (loading) {
      return;
    }
    async function updateFeed(feed: FeedType, index: number) {
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
        return feed;
      } catch (e) {
        console.log(e);
      }
    }

    async function refetchFeeds() {
      const newActive: FeedType[] = [];
      const active = [...feeds.active];
      let failed = [...feeds.failed];

      for (const [index, feed] of active.entries()) {
        const newFeed = await updateFeed({ ...feed }, index);

        if (newFeed) {
          newActive.push(newFeed);
        }
        else {
          newActive.push({
            ...feed,
            message: locale.rssFeed.fetch_error
          });
        }
      }

      if (failed.length) {
        for (const feed of feeds.failed) {
          const data = await feedService.fetchFeed(feed);

          if (!("message" in data)) {
            failed = failed.filter(({ url }) => url !== feed.url);
            newActive.splice(feed.index, 0, data);
          }
        }
      }
      setFeeds({
        ...feeds,
        active: newActive
      });
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

    if (feeds.active.length || feeds.failed.length) {
      scheduleFeedUpdate();
    }
    return () => {
      clearTimeout(timeoutId.current);
    };
  }, [loading, feeds]);

  useEffect(() => {
    function animateNavigation() {
      let animateLeft = navigation.animateLeft;
      let animateRight = navigation.animateRight;

      for (const index of updatedFeeds.current) {
        if (index < navigation.shift) {
          animateLeft = true;
        }

        if (index >= navigation.shift + VISIBLE_ITEM_COUNT) {
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

    if (updatedFeeds.current.length) {
      if (!activeComponent) {
        animateNavigation();
      }
      showIndicator("rssFeed");
    }
    updatedFeeds.current.length = 0;
  }, [navigation, feeds]);

  function previousShift() {
    const index = navigation.activeIndex;
    const shift = navigation.shift - 1;
    let animateLeft = navigation.animateLeft;

    if (animateLeft) {
      animateLeft = feeds.active.slice(0, shift).some(({ newEntryCount }) => newEntryCount > 0);
    }
    selectView({
      ...navigation,
      activeIndex: index >= shift + VISIBLE_ITEM_COUNT ? index - 1 : index,
      shift,
      animateLeft
    });
  }

  function nextShift() {
    const index = navigation.activeIndex;
    const shift = navigation.shift + 1;
    let animateRight = navigation.animateRight;

    if (animateRight) {
      animateRight = feeds.active.slice(shift + VISIBLE_ITEM_COUNT).some(({ newEntryCount }) => newEntryCount > 0);
    }
    selectView({
      ...navigation,
      activeIndex: index < shift ? index + 1 : index,
      shift,
      animateRight
    });
  }

  function selectFeed(element: HTMLElement, index: number, container: HTMLElement) {
    if (element.closest("[data-entry-count]")) {
      markEntriesAsRead(feeds.active[index]);
    }
    else {
      container.scrollTop = 0;

      selectView({
        ...navigation,
        activeIndex: index
      });
    }
  }

  function selectFeedFromList({ target }: MouseEvent, index: number) {
    if ((target as HTMLElement).closest("[data-entry-count]")) {
      markEntriesAsRead(feeds.active[index]);
      return;
    }
    let { shift } = navigation;

    if (index < shift || index >= shift + VISIBLE_ITEM_COUNT) {
      shift = index > feeds.active.length - VISIBLE_ITEM_COUNT ? feeds.active.length - VISIBLE_ITEM_COUNT : index;
    }
    selectView({
      ...navigation,
      activeIndex: index,
      shift
    });
    hideFeedList();
  }

  function markEntriesAsRead(feed: FeedType) {
    const index = feeds.active.findIndex(({ id }) => feed.id === id);

    setFeeds({
      ...feeds,
      active: feeds.active.with(index, {
        ...feed,
        newEntryCount: 0,
        entries: feed.entries.map(entry => {
          entry.newEntry = false;
          return entry;
        })
      })
    });
  }

  function markEntryAsRead(entry: Entry, index: number) {
    if (entry.newEntry) {
      const activeFeed = feeds.active[navigation.activeIndex];
      const entries = activeFeed.entries.with(index, {
        ...entry,
        newEntry: false,
      });

      setFeeds({
        ...feeds,
        active: feeds.active.with(navigation.activeIndex, {
          ...activeFeed,
          entries,
          newEntryCount: activeFeed.newEntryCount - 1
        })
      });
    }
  }

  function expandEntry(entry: Entry, index: number) {
    const activeFeed = feeds.active[navigation.activeIndex];
    const entries = activeFeed.entries.with(index, {
      ...entry,
      truncated: false,
    });

    setFeeds({
      ...feeds,
      active: feeds.active.with(navigation.activeIndex, {
        ...activeFeed,
        entries
      })
    });
  }

  function updateFeeds(feeds: Feeds, save = true) {
    setFeeds({ ...feeds });

    if (save) {
      saveFeeds(feeds);
    }
  }

  function updateTypeFeed(feed: FeedType, type: FeedTypeName, save = true) {
    updateFeeds({
      ...feeds,
      [type]: feeds[type].map(f => {
        if (f.id === feed.id) {
          return feed;
        }
        return f;
      })
    }, save);
  }

  function removeFeed(index: number, type: FeedTypeName, save = true) {
    const newFeeds = {
      ...feeds,
      [type]: feeds[type].toSpliced(index, 1)
    };

    if (type === "active" && newFeeds.active.length) {
      selectView({ activeIndex: 0, shift: 0 });
    }
    else if (!newFeeds.active.length) {
      if (newFeeds.inactive.length || newFeeds.failed.length) {
        showFeedList();
      }
      else {
        showForm();
      }
      localStorage.removeItem("active-feed-tab");
    }
    updateFeeds(newFeeds, save);
  }

  function addFeed(feed: FeedType) {
    const active = feeds.active;

    selectView({
      ...navigation,
      activeIndex: active.length === 0 ? 0 : active.length - 1,
      shift: active.length - VISIBLE_ITEM_COUNT < 0 ? 0 : active.length - VISIBLE_ITEM_COUNT
    });
    setActiveComponent("");
    updateFeeds({
      ...feeds,
      active: [...active, feed]
    });
  }

  function deactivateFeed(index: number) {
    const active = [...feeds.active];
    const [feed] = active.splice(index, 1);

    if (active.length) {
      selectView({ activeIndex: 0, shift: 0 });
    }
    updateFeeds({
      ...feeds,
      active,
      inactive: [...feeds.inactive, feed]

    });
  }

  function hideForm() {
    setActiveComponent("feeds");
  }

  function hideFeedList() {
    setActiveComponent("");
  }

  function selectView(navigation: Nav) {
    setNavigation(navigation);

    saveTabTimeoutId.current = timeout(() => {
      localStorage.setItem("active-feed-tab", JSON.stringify({
        activeIndex: navigation.activeIndex,
        shift: navigation.shift
      }));
    }, 400, saveTabTimeoutId.current);
  }

  function saveFeeds(feeds: Feeds) {
    chromeStorage.set({
      feeds: {
        active: feeds.active.concat(feeds.failed).map(({ url, title }) => ({ url, title })),
        inactive: (feeds.inactive as Partial<FeedType>[]).map(feed => {
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
      <Suspense fallback={<Spinner size="24px"/>}>
        {activeComponent === "feeds" && (
          <Feeds feeds={feeds} locale={locale} selectFeedFromList={selectFeedFromList}
            removeFeed={removeFeed} deactivateFeed={deactivateFeed}
            updateFeed={updateTypeFeed}
            updateFeeds={updateFeeds} showForm={showForm} hide={hideFeedList}/>
        )}
        {activeComponent === "form" && <Form feeds={feeds} locale={locale} addFeed={addFeed} hide={hideForm}/>}
      </Suspense>
    );
  }
  return (
    <Suspense fallback={<Spinner size="24px"/>}>
      <Entries navigation={navigation} feeds={feeds}
        locale={locale} selectFeed={selectFeed} previousShift={previousShift} nextShift={nextShift}
        showFeedList={showFeedList} markEntryAsRead={markEntryAsRead} expandEntry={expandEntry}/>
    </Suspense>
  );
}
