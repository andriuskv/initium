import { useState, useEffect, useLayoutEffect, useRef, lazy, Suspense, type ReactNode } from "react";
import type { AppearanceSettings, MainPanelSettings } from "types/settings";
import type { Tab, Tabs } from "./MainPanel.type";
import { getSetting, updateSetting } from "services/settings";
import { handleZIndex } from "services/widgetStates";
import { hasStoredFeeds } from "services/feeds";
import { useLocalization } from "contexts/localization";
import Icon from "components/Icon";
import Resizer from "components/Resizer";
import Spinner from "components/Spinner";
import "./main-panel.css";
import Sidebar from "./Sidebar";
import Nav from "./Nav/Nav";


const TopSites = lazy(() => import("./TopSites"));
const Notepad = lazy(() => import("./Notepad"));
const RssFeed = lazy(() => import("./RssFeed"));

type Props = {
  settings: MainPanelSettings
}

type ActiveTab = {
  id: string,
  expanded?: boolean,
  collapsing?: boolean,
  manuallySelected?: boolean,
  params?: { [key: string]: any }
}

function Component({ children, tab, activeTabId, showSpinner }: { children: ReactNode, tab: Tab, activeTabId: string, showSpinner?: boolean}) {
  if (tab.disabled) {
    return null;
  }
  const fallback = showSpinner ?
    <Spinner size="24px"/> :
    <Icon id={tab.iconId} className="main-panel-item-splash-icon animate"/>;

  return (
    <div className={`container main-panel-item${activeTabId === tab.id ? "" : " hidden"}`}>
      {tab.renderPending ? fallback : <Suspense fallback={fallback}>{children}</Suspense>}
    </div>
  );
}

function getTabs(locale: any, settings: MainPanelSettings): Tabs {
  const tabs: Tabs = {
    topSites: {
      id: "topSites",
      title: locale.topSites.title,
      iconId: "top-sites",
      renderPending: true
    },
    notepad: {
      id: "notepad",
      title: locale.notepad.title,
      iconId: "notepad",
      expandable: true,
      renderPending: true
    },
    rssFeed: {
      id: "rssFeed",
      title: locale.rssFeed.feeds_title,
      iconId: "rss",
      delay: 1200000,
      expandable: true,
      firstRender: true,
      renderPending: true
    }
  };

  for (const tab of Object.values(tabs)) {
    tab.disabled = settings.components[tab.id as keyof MainPanelSettings["components"]].disabled;
  }
  return tabs;
}

export default function MainPanel({ settings }: Props) {
  const locale = useLocalization();
  const [activeTab, setActiveTab] = useState((): ActiveTab => {
    return { id: localStorage.getItem("mainPanelTab") ?? "topSites" };
  });
  const [tabs, setTabs] = useState(() => getTabs(locale, settings));
  const [resizerEnabled, setResizerEnabled] = useState(false);
  const [feedReady, setFeedReady] = useState(false);
  const tabTimeouts = useRef<({ [key: string]: number })>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const tabExpandable = tabs[activeTab.id]?.expandable;

  useLayoutEffect(() => {
    function selectTopSitesTab() {
      setActiveTab({ id: "topSites", params: { enableEdit: true } });
      localStorage.setItem("mainPanelTab", "topSites");
    }

    if (containerRef.current && settings.height) {
      containerRef.current.style.setProperty("--height", `${settings.height}px`);
    }

    window.addEventListener("enable-persistent-site-edit", selectTopSitesTab);

    return () => {
      window.removeEventListener("enable-persistent-site-edit", selectTopSitesTab);
    };
  }, []);

  function selectTab(id: string) {
    const newId = id === activeTab.id ? "" : id;

    if (tabs[newId]?.indicatorVisible) {
      setTabs({
        ...tabs,
        [newId]: {
          ...tabs[newId],
          indicatorVisible: false
        }
      });
    }
    setActiveTab({ id: newId, manuallySelected: true });
    localStorage.setItem("mainPanelTab", newId);
  }

  useEffect(() => {
    let firstEnabledTab = "";
    let activeTabDisabled = false;
    let disabledComponentCount = 0;
    const newTabs: Tabs = {};
    const componentEntries = Object.entries(settings.components);

    for (const [id, { disabled }] of componentEntries) {
      const tab = tabs[id];
      newTabs[id] = {
        ...tab,
        disabled
      };

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

    if (activeTabDisabled || activeTab.id === "twitter" || activeTab.id === "" && disabledComponentCount >= componentEntries.length - 1) {
      selectTab(firstEnabledTab);
    }
    setTabs(newTabs);
  }, [settings.components]);

  async function initComponent(id: string, callback: () => Promise<boolean>) {
    const tab = { ...tabs[id] };
    let delay = -1;

    clearTimeout(tabTimeouts.current[id]);
    delete tabTimeouts.current[id];

    if (activeTab.id === id) {
      delay = activeTab.manuallySelected ? 1 : 2000;
    }
    else if (tab.firstRender && tab.delay && await callback()) {
      delay = tab.delay;
    }

    if (delay > 0) {
      tabTimeouts.current[id] = window.setTimeout(() => {
        setFeedReady(true);
      }, delay);
    }
  }

  useEffect(() => {
    if (resizerEnabled) {
      setResizerEnabled(false);
    }

    if (activeTab.id !== "rssFeed" && tabs[activeTab.id]?.renderPending) {
      setTabs({
        ...tabs,
        [activeTab.id]: {
          ...tabs[activeTab.id],
          renderPending: false
        }
      });
    }

    if (tabs.rssFeed.renderPending) {
      initComponent("rssFeed", hasStoredFeeds);
    }
  }, [activeTab.id]);

  useEffect(() => {
    if (feedReady) {
      setTabs({
        ...tabs,
        rssFeed: {
          ...tabs.rssFeed,
          firstRender: false,
          renderPending: false
        }
      });
    }
  }, [feedReady]);

  function expandTab() {
    const willExpand = !activeTab.expanded;

    if (willExpand) {
      setActiveTab({
        ...activeTab,
        expanded: willExpand
      });
      setResizerEnabled(false);
    }
    else {
      const { animationSpeed } = getSetting("appearance") as AppearanceSettings;

      setActiveTab({
        ...activeTab,
        expanded: false,
        collapsing: true
      });

      setTimeout(() => {
        setActiveTab({
          ...activeTab,
          collapsing: false,
          expanded: false
        });
      }, 200 * animationSpeed);
    }
  }

  function showIndicator(id: string) {
    if (id !== activeTab.id) {
      setTabs({
        ...tabs,
        [id]: {
          ...tabs[id],
          indicatorVisible: true
        } });
    }
  }

  function toggleResizer() {
    setResizerEnabled(!resizerEnabled);
  }

  function saveHeight(height: number) {
    updateSetting("mainPanel", { height });
  }

  return (
    <div className={`main-panel${tabExpandable ? " expandable" : ""}${activeTab.expanded ? " expanded" : ""}${settings.navHidden || settings.navDisabled ? " nav-hidden" : ""}${activeTab.collapsing ? " collapsing" : ""}`}
      onClick={event => handleZIndex(event, "mainPanel")} ref={containerRef}>
      <Nav tabs={tabs} disabled={settings.navHidden || settings.navDisabled} selectTab={selectTab}/>
      {tabExpandable && (
        <Sidebar expanded={activeTab.expanded} locale={locale} expandTab={expandTab}
          resizerEnabled={resizerEnabled} toggleResizer={toggleResizer}/>
      )}
      {tabs.topSites.disabled || tabs.topSites.renderPending ? null : (
        <div className={`main-panel-item top-sites-container${activeTab.id === tabs.topSites.id ? "" : " hidden"}`}>
          <Suspense fallback={null}>
            <TopSites settings={settings.components.topSites} locale={locale} { ...(activeTab.params ? activeTab.params : {})}/>
          </Suspense>
        </div>
      )}
      <Component tab={tabs.notepad} activeTabId={activeTab.id} showSpinner={true}>
        <Notepad locale={locale}/>
      </Component>
      <Component tab={tabs.rssFeed} activeTabId={activeTab.id}>
        <RssFeed locale={locale} showIndicator={showIndicator}/>
      </Component>
      {resizerEnabled && <Resizer saveHeight={saveHeight}/>}
    </div>
  );
}
