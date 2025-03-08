import { useState, useEffect, useRef, lazy, Suspense, useMemo } from "react";
import { timeout } from "utils";
import * as focusService from "services/focus";
import TabsContainer from "components/TabsContainer";
import Spinner from "components/Spinner";
import Icon from "components/Icon";
import "./settings.css";

const GeneralTab = lazy(() => import("./GeneralTab"));
const AppearanceTab = lazy(() => import("./AppearanceTab"));
const TimeDateTab = lazy(() => import("./TimeDateTab"));
const MainPanelTab = lazy(() => import("./MainPanelTab"));
const TasksTab = lazy(() => import("./TasksTab"));
const WeatherTab = lazy(() => import("./WeatherTab"));
const TimersTab = lazy(() => import("./TimersTab"));
const StorageTab = lazy(() => import("./StorageTab"));
const LogsTab = lazy(() => import("./LogsTab"));

export default function Settings({ locale, hide }: { locale: any, hide: () => void}) {
  const tabs = useMemo(() => [
    {
      id: "general",
      name: locale.settings.general.title,
      component: GeneralTab
    },
    {
      id: "appearance",
      name: locale.settings.appearance.title,
      component: AppearanceTab
    },
    {
      id: "timeDate",
      name: locale.settings.time_date.title,
      component: TimeDateTab
    },
    {
      id: "mainPanel",
      name: locale.settings.main_panel.title,
      component: MainPanelTab
    },
    {
      id: "tasks",
      name: locale.tasks.title,
      component: TasksTab
    },
    {
      id: "weather",
      name: locale.settings.weather.title,
      component: WeatherTab
    },
    {
      id: "timers",
      name: locale.settings.timers.title,
      component: TimersTab
    },
    {
      id: "storage",
      name: locale.settings.storage.title,
      component: StorageTab
    },
    {
      id: "logs",
      name: "Logs",
      shouldHide: (JSON.parse(localStorage.getItem("announcements")) || []).length === 0,
      component: LogsTab
    }
  ], [locale]);
  const [activeTabId, setActiveTabId] = useState(() => {
    const id = localStorage.getItem("active-settings-tab");
    const activeTabIndex = tabs.findIndex((tab) => tab.id === id);

    if (activeTabIndex > -1 && tabs[activeTabIndex].shouldHide) {
      return "general";
    }
    return id || "general";
  });
  const saveTabTimeoutId = useRef(0);
  const activeTabIndex = tabs.findIndex(tab => tab.id === activeTabId);
  const activeTab = tabs[activeTabIndex];

  useEffect(() => {
    focusService.updateFocusTrap("fullscreen-modal");
  }, [activeTabId]);

  function selectTab(id: string) {
    setActiveTabId(id);

    saveTabTimeoutId.current = timeout(() => {
      localStorage.setItem("active-settings-tab", id);
    }, 400, saveTabTimeoutId.current);
  }

  return (
    <div className="settings">
      <div className="container-header settings-header">
        <Icon id="settings"/>
        <h3 className="container-header-title">{locale.settings.title}</h3>
        <button className="btn icon-btn" onClick={hide} title={locale.global.close}>
          <Icon id="cross"/>
        </button>
      </div>
      <div className="settings-body">
        <TabsContainer className="setting-nav-container" current={activeTabIndex} orientation="v">
          <ul className="settings-nav">
            {tabs.map(tab => !tab.shouldHide && (
              <li className={`settings-nav-item${activeTabId === tab.id ? " active" : ""}`} key={tab.id}>
                <button className="btn text-btn settings-nav-item-btn"
                  onClick={() => selectTab(tab.id)}>{tab.name}</button>
              </li>
            ))}
          </ul>
        </TabsContainer>
        {activeTab.id === "mainPanel" ? (
          <Suspense fallback={<Spinner/>}>
            <MainPanelTab locale={locale} hide={hide}/>
          </Suspense>
        ) : (
          <Suspense fallback={<Spinner/>}>
            <activeTab.component locale={locale}/>
          </Suspense>
        )}
      </div>
    </div>
  );
}
