import { useState, useEffect, useLayoutEffect, useRef, lazy, Suspense } from "react";
import { getSetting, updateSetting } from "services/settings";
import { handleZIndex } from "services/zIndex";
// import { hasUsers } from "services/twitter";
import { hasStoredFeeds } from "services/feeds";
import Icon from "components/Icon";
import "./main-panel.css";
import Sidebar from "./Sidebar";

const TopSites = lazy(() => import("./TopSites"));
const Notepad = lazy(() => import("./Notepad"));
// const Twitter = lazy(() => import("./Twitter"));
const RssFeed = lazy(() => import("./RssFeed"));
const Resizer = lazy(() => import("components/Resizer"));

export default function MainPanel({ settings }) {
  const [activeTab, setActiveTab] = useState(() => {
    return { id: localStorage.getItem("mainPanelTab") ?? "topSites" };
  });
  const [tabs, setTabs] = useState(() => getTabs());
  const [resizerEnabled, setResizerEnabled] = useState(false);
  const tabTimeouts = useRef({});
  const containerRef = useRef(null);
  const tabExpandable = tabs[activeTab.id]?.expandable;

  useLayoutEffect(() => {
    const { height } = getSetting("mainPanel");

    if (height) {
      containerRef.current.style.setProperty("--height", `${height}px`);
    }
  }, []);

  useEffect(() => {
    const tabsArray = Object.values(tabs);
    let firstEnabledTab = "";
    let activeTabDisabled = false;
    let disabledComponentCount = 0;

    for (const tab of tabsArray) {
      const { disabled } = settings.components[tab.id];
      tab.disabled = disabled;

      if (disabled) {
        disabledComponentCount += 1;

        if (activeTab.id === tab.id) {
          activeTabDisabled = true;
        }
      }
      else if (!firstEnabledTab) {
        firstEnabledTab = tab.id;
      }
    }

    if (activeTabDisabled || activeTab.id === "twitter" || activeTab.id === "" && disabledComponentCount >= tabsArray - 1) {
      selectTab(firstEnabledTab);
    }
    setTabs({ ...tabs });
  }, [settings.components]);

  useEffect(() => {
    if (tabs.topSites.renderPending && activeTab.id === "topSites") {
      tabs.topSites.renderPending = false;
      setTabs({ ...tabs });
    }
    else if (tabs.notepad.renderPending && activeTab.id === "notepad") {
      tabs.notepad.renderPending = false;
      setTabs({ ...tabs });
    }

    // if (tabs.twitter.renderPending) {
    //   initComponent("twitter", hasUsers);
    // }

    if (tabs.rssFeed.renderPending) {
      initComponent("rssFeed", hasStoredFeeds);
    }
  }, [activeTab.id]);

  async function initComponent(id, callback) {
    const tab = tabs[id];
    let delay = -1;

    if (activeTab.id === id) {
      delay = activeTab.manualySelected ? 1 : 2000;
      clearTimeout(tabTimeouts.current[id]);
    }
    else if (tab.firstRender && await callback()) {
      delay = tab.delay;
      tab.firstRender = false;
    }

    if (delay > 0) {
      tabTimeouts.current[id] = setTimeout(() => {
        tab.renderPending = false;
        setTabs({ ...tabs });
      }, delay);
    }
  }

  function getTabs() {
    const tabs = {
      topSites: {
        id: "topSites",
        title: "Top sites",
        iconId: "top-sites",
        renderPending: true
      },
      notepad: {
        id: "notepad",
        title: "Notepad",
        iconId: "notepad",
        expandable: true,
        renderPending: true
      },
      // twitter: {
      //   id: "twitter",
      //   title: "Twitter",
      //   iconId: "twitter",
      //   delay: 600000,
      //   expandable: true,
      //   firstRender: true,
      //   renderPending: true
      // },
      rssFeed: {
        id: "rssFeed",
        title: "RSS feed",
        iconId: "rss",
        delay: 1200000,
        expandable: true,
        firstRender: true,
        renderPending: true
      }
    };

    for (const tab of Object.values(tabs)) {
      tab.disabled = settings.components[tab.id].disabled;
    }
    return tabs;
  }

  function selectTab(id) {
    const newId = id === activeTab.id ? "" : id;
    const tab = tabs[newId];

    if (tab?.indicatorVisible) {
      tab.indicatorVisible = false;
      setTabs({ ...tabs });
    }
    setActiveTab({ id: newId });
    localStorage.setItem("mainPanelTab", newId);
  }

  function expandTab() {
    const willExpand = !activeTab.expanded;

    if (willExpand) {
      setResizerEnabled(false);
    }
    setActiveTab({
      ...activeTab,
      expanded: !activeTab.expanded
    });
  }

  function showIndicator(id) {
    if (id !== activeTab.id) {
      tabs[id].indicatorVisible = true;
      setTabs({ ...tabs });
    }
  }

  function toggleResizer() {
    setResizerEnabled(!resizerEnabled);
  }

  function saveHeight(height) {
    updateSetting({ mainPanel: { height } });
  }

  function renderTopSites() {
    const tab = tabs.topSites;

    if (tab.disabled || tab.renderPending) {
      return null;
    }
    return (
      <div className={`main-panel-item top-sites-container${activeTab.id === tab.id ? "" : " hidden"}`}>
        <Suspense fallback={null}>
          <TopSites settings={settings.components.topSites}/>
        </Suspense>
      </div>
    );
  }

  function renderComponent(id, component, ignoreFallback) {
    const tab = tabs[id];

    if (tab.disabled) {
      return null;
    }
    const fallback = ignoreFallback ? null : <Icon id={tab.iconId} className="main-panel-item-splash-icon animate"/>;

    return (
      <div className={`container main-panel-item${activeTab.id === id ? "" : " hidden"}`}>
        {tab.renderPending ? fallback : <Suspense fallback={fallback}>{component}</Suspense>}
      </div>
    );
  }

  function renderNavigation() {
    if (settings.navHidden || settings.navDisabled) {
      return;
    }
    return (
      <ul className="main-panel-nav">
        {Object.values(tabs).map(tab => (
          tab.disabled ? null : (
            <li className="main-panel-nav-item" key={tab.id}>
              <button className={`btn icon-btn panel-item-btn${tab.indicatorVisible ? " indicator" : ""}`}
                onClick={() => selectTab(tab.id)} title={tab.title}>
                <Icon id={tab.iconId} className="panel-item-btn-icon"/>
              </button>
            </li>
          )
        ))}
      </ul>
    );
  }

  return (
    <div className={`main-panel${tabExpandable ? " expandable" : ""}${activeTab.expanded ? " expanded" : ""}${settings.navHidden || settings.navDisabled ? " nav-hidden" : ""}`} onClick={handleZIndex} ref={containerRef}>
      {renderNavigation()}
      {tabExpandable && (
        <Sidebar expanded={activeTab.expanded} expandTab={expandTab} resizerEnabled={resizerEnabled} toggleResizer={toggleResizer}/>
      )}
      {renderTopSites()}
      {renderComponent("notepad", <Notepad/>, true)}
      {/* {renderComponent("twitter", <Twitter showIndicator={showIndicator}/>)} */}
      {renderComponent("rssFeed", <RssFeed showIndicator={showIndicator}/>)}
      <Suspense fallback={null}>
        {resizerEnabled && <Resizer saveHeight={saveHeight}/>}
      </Suspense>
    </div>
  );
}
