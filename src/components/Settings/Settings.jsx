import { useState, useEffect, lazy, Suspense } from "react";
import * as focusService from "services/focus";
import FullscreenModal from "components/FullscreenModal";
import Spinner from "components/Spinner";
import Icon from "components/Icon";
import "./settings.css";
import GeneralTab from "./GeneralTab";

const AppearanceTab = lazy(() => import("./AppearanceTab"));
const TimeDateTab = lazy(() => import("./TimeDateTab"));
const MainPanelTab = lazy(() => import("./MainPanelTab"));
const TasksTab = lazy(() => import("./TasksTab"));
const WeatherTab = lazy(() => import("./WeatherTab"));
const TimersTab = lazy(() => import("./TimersTab"));
const StorageTab = lazy(() => import("./StorageTab"));

export default function Settings({ hiding, locale, hide }) {
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    focusService.updateFocusTrap("fullscreen-modal");
  }, [activeTab]);

  function renderNavigation() {
    const tabs = [
      {
        id: "general",
        name: locale.settings.general.title
      },
      {
        id: "appearance",
        name: locale.settings.appearance.title
      },
      {
        id: "timeDate",
        name: locale.settings.time_date.title
      },
      {
        id: "mainPanel",
        name: locale.settings.main_panel.title
      },
      {
        id: "tasks",
        name: locale.tasks.title
      },
      {
        id: "weather",
        name: locale.settings.weather.title
      },
      {
        id: "timers",
        name: locale.settings.timers.title
      },
      {
        id: "storage",
        name: locale.settings.storage.title
      }
    ];

    return (
      <ul className="settings-nav">
        {tabs.map(tab => (
          <li className={`settings-nav-item${activeTab === tab.id ? " active" : ""}`} key={tab.id}>
            <button className="btn text-btn settings-nav-item-btn"
              onClick={() => setActiveTab(tab.id)}>{tab.name}</button>
          </li>
        ))}
      </ul>
    );
  }

  function renderTab() {
    if (activeTab === "general") {
      return <GeneralTab locale={locale}/>;
    }
    let Component = null;

    if (activeTab === "appearance") {
      Component = AppearanceTab;
    }
    else if (activeTab === "timeDate") {
      Component = TimeDateTab;
    }
    else if (activeTab === "mainPanel") {
      Component = MainPanelTab;
    }
    else if (activeTab === "tasks") {
      Component = TasksTab;
    }
    else if (activeTab === "weather") {
      Component = WeatherTab;
    }
    else if (activeTab === "timers") {
      Component = TimersTab;
    }
    else if (activeTab === "storage") {
      Component = StorageTab;
    }
    return (
      <Suspense fallback={<Spinner className="setting-tab-spinner"/>}>
        <Component locale={locale} hide={hide}/>
      </Suspense>
    );
  }

  return (
    <FullscreenModal hiding={hiding} hide={hide}>
      <div className="settings">
        <div className="container-header settings-header">
          <Icon id="settings"/>
          <h3 className="container-header-title">{locale.settings.title}</h3>
          <button className="btn icon-btn" onClick={hide} title={locale.global.close}>
            <Icon id="cross"/>
          </button>
        </div>
        <div className="settings-body">
          {renderNavigation()}
          {renderTab()}
        </div>
      </div>
    </FullscreenModal>
  );
}
