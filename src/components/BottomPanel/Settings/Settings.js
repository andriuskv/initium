import { useState, lazy, Suspense } from "react";
import Spinner from "components/Spinner";
import "./settings.css";
import GeneralTab from "./GeneralTab";

const TimeDateTab = lazy(() => import("./TimeDateTab"));
const MainPanelTab = lazy(() => import("./MainPanelTab"));
const BackgroundTab = lazy(() => import("./BackgroundTab"));
const WeatherTab = lazy(() => import("./WeatherTab"));
const StorageTab = lazy(() => import("./StorageTab"));

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");

  function renderNavigation() {
    const tabs = [
      {
        id: "general",
        name: "General"
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
        id: "background",
        name: "Background"
      },
      {
        id: "weather",
        name: "Weather"
      },
      {
        id: "storage",
        name: "Storage"
      }
    ];

    return (
      <ul className="settings-nav">
        {tabs.map(tab => (
          <li className={`settings-nav-item${activeTab === tab.id ? " active" : ""}`} key={tab.id}>
            <button className="btn text-btn settings-nav-item-btn" onClick={() => setActiveTab(tab.id)}>{tab.name}</button>
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

    if (activeTab === "timeDate") {
      Component = TimeDateTab;
    }
    else if (activeTab === "mainPanel") {
      Component = MainPanelTab;
    }
    else if (activeTab === "background") {
      Component = BackgroundTab;
    }
    else if (activeTab === "weather") {
      Component = WeatherTab;
    }
    else if (activeTab === "storage") {
      Component = StorageTab;
    }
    return <Suspense fallback={<Spinner className="setting-tab-spinner"/>}><Component/></Suspense>;
  }

  return (
    <div className="settings">
      {renderNavigation()}
      {renderTab()}
    </div>
  );
}
