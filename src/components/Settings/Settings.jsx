import { useState, useEffect, lazy, Suspense } from "react";
import { dispatchCustomEvent } from "utils";
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

export default function Settings({ hide }) {
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    return () => {
      dispatchCustomEvent("enable-persistent-site-edit", false);
    };
  });

  function renderNavigation() {
    const tabs = [
      {
        id: "general",
        name: "General"
      },
      {
        id: "appearance",
        name: "Appearance"
      },
      {
        id: "timeDate",
        name: "Time & Date"
      },
      {
        id: "mainPanel",
        name: "Main Panel"
      },
      {
        id: "tasks",
        name: "Tasks"
      },
      {
        id: "weather",
        name: "Weather"
      },
      {
        id: "timers",
        name: "Timers"
      },
      {
        id: "storage",
        name: "Storage"
      }
    ];

    return (
      <ul className="settings-nav">
        {tabs.map(tab => (
          <li key={tab.id}>
            <button className={`btn text-btn settings-nav-item-btn${activeTab === tab.id ? " active" : ""}`}
              onClick={() => setActiveTab(tab.id)}>{tab.name}</button>
          </li>
        ))}
      </ul>
    );
  }

  function renderTab() {
    if (activeTab === "general") {
      return <GeneralTab/>;
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
    return <Suspense fallback={<Spinner className="setting-tab-spinner"/>}><Component/></Suspense>;
  }

  return (
    <FullscreenModal hide={hide}>
      <div className="settings">
        <div className="settings-header">
          <Icon id="settings"/>
          <h3>Settings</h3>
          <button className="btn icon-btn" onClick={hide} title="Close">
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
