import { useState, useRef } from "react";
import type { Hour, View } from "types/weather";
import { timeout } from "utils";
import TabsContainer from "components/TabsContainer";
import "./HourlyView.css";
import TempView from "./TempView/TempView";
import PrecView from "./PrecView/PrecView";
import WindView from "./WindView/WindView";

type Props = {
  locale: any,
  hourly: Hour[],
  speedUnits: "m/s" | "ft/s"
}

export default function HourlyView({ locale, hourly, speedUnits }: Props) {
  const [activeView, setActiveView] = useState<View>(() => (localStorage.getItem("active-weather-tab") || "temperature") as View);
  const saveTabTimeoutId = useRef(0);
  const views: View[] = ["temperature", "precipitation", "wind"];
  const activeTabIndex = views.indexOf(activeView) >= 0 ? views.indexOf(activeView) : 0;

  function selectView(view: View) {
    setActiveView(view);

    saveTabTimeoutId.current = timeout(() => {
      localStorage.setItem("active-weather-tab", view);
    }, 400, saveTabTimeoutId.current);
  }

  return (
    <div className="container-body weather-more-hourly-view-container">
      <TabsContainer className="weather-more-hourly-view-top" current={activeTabIndex}>
        <ul className="weather-more-hourly-view-top-items">
          {views.map(view => (
            <li key={view}>
              <button className={`btn text-btn weather-more-hourly-view-top-btn${activeView === view ? " active" : ""}`}
                onClick={() => selectView(view)}>{locale.weather[view]}</button>
            </li>
          ))}
        </ul>
      </TabsContainer>
      {activeView === "temperature" ? <TempView hourly={hourly} />
        : activeView === "precipitation" ? <PrecView hourly={hourly} />
          : activeView === "wind" ? <WindView hourly={hourly} speedUnits={speedUnits} /> : null
      }
      <div className="weather-more-hourly-view-time">
        {hourly.filter((_, index) => index % 3 === 1).map(item => (
          <time className="weather-more-hourly-view-time-item" key={item.id} title={item.timeLocal}>{item.time}</time>
        ))}
      </div>
    </div>
  );
}
