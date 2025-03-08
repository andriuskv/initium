import type { Current, Hour, Weekday, View } from "types/weather";
import { useState, useRef, type CSSProperties } from "react";
import { timeout } from "utils";
import { useSettings } from "contexts/settings";
import TabsContainer from "components/TabsContainer";
import Icon from "components/Icon";
import Spinner from "components/Spinner";
import Dropdown from "components/Dropdown";
import "./more-weather.css";
import HourlyView from "./HourlyView";

type Props = {
  current: Current,
  more: { hourly: Hour[], daily: Weekday[] } | null,
  units: "C" | "F",
  speedUnits: "m/s" | "ft/s",
  message: string,
  locale: any,
  hide: () => void
}

const views = ["temp", "prec", "wind"];

export default function MoreWeather({ current, more, units, speedUnits, message, locale, hide }: Props) {
  const { settings: { weather: settings }, updateContextSetting } = useSettings();
  const [view, setView] = useState<View>(() => (localStorage.getItem("active-weather-tab") || "temp") as View);
  const saveTabTimeoutId = useRef(0);
  const activeTabIndex = views.indexOf(view);

  function toggleUnits(type: "temp" | "wind") {
    if (type === "temp") {
      const { units } = settings;

      updateContextSetting("weather", { units: units === "C" ? "F" : "C" });
    }
    else if (type === "wind") {
      const { speedUnits } = settings;

      updateContextSetting("weather", { speedUnits: speedUnits === "m/s" ? "ft/s" : "m/s" });
    }
  }

  function selectView(view: View) {
    setView(view);

    saveTabTimeoutId.current = timeout(() => {
      localStorage.setItem("active-weather-tab", view);
    }, 400, saveTabTimeoutId.current);
  }

  return (
    <>
      <div className="container-header weather-more-current">
        <div className="weather-more-current-icon-container">
          <img src={current.icon} className={`weather-more-current-icon icon-${current.iconId}`} alt="" width="100px" height="100px" loading="lazy"/>
        </div>
        <div className="weather-more-current-main">
          <div className="weather-more-current-location">{current.location}</div>
          <div className="weather-more-current-main-info">
            <div className="weather-more-current-temperature">
              <div className="weather-more-current-temperature-value">{Math.round(current.temperature)}</div>
              <div className="weather-more-current-temperature-units">°{units}</div>
            </div>
            <div className="weather-more-current-secondary">
              <div className="weather-more-current-secondary-item">
                <span className="weather-more-current-secondary-name">{locale.weather.precipitation}:</span>
                <span>{current.precipitation ?? 0}%</span>
              </div>
              <div className="weather-more-current-secondary-item">
                <span className="weather-more-current-secondary-name">{locale.weather.humidity}:</span>
                <span>{current.humidity}%</span>
              </div>
              <div className="weather-more-current-secondary-item">
                <span className="weather-more-current-secondary-name">{locale.weather.wind}:</span>
                <span className="weather-more-current-wind">
                  <span>{current.wind.speed.value} {speedUnits}</span>
                  <svg viewBox="0 0 24 24" className="weather-more-current-wind-icon"
                    style={{ "--degrees": current.wind.direction.degrees } as CSSProperties}>
                    <title>{current.wind.direction.name}</title>
                    <use href="#arrow-up"></use>
                  </svg>
                </span>
              </div>
            </div>
          </div>
          <div className="weather-more-current-description">{current.description}</div>
        </div>
      </div>
      {more ? (
        <>
          <div className="container-body weather-more-hourly-view-container">
            <TabsContainer className="weather-more-hourly-view-top" current={activeTabIndex}>
              <ul className="weather-more-hourly-view-top-items">
                <li>
                  <button className={`btn text-btn weather-more-hourly-view-top-btn${view === "temp" ? " active" : ""}`}
                    onClick={() => selectView("temp")}>{locale.weather.temperature}</button>
                </li>
                <li>
                  <button className={`btn text-btn weather-more-hourly-view-top-btn${view === "prec" ? " active" : ""}`}
                    onClick={() => selectView("prec")}>{locale.weather.precipitation}</button>
                </li>
                <li>
                  <button className={`btn text-btn weather-more-hourly-view-top-btn${view === "wind" ? " active" : ""}`}
                    onClick={() => selectView("wind")}>{locale.weather.wind}</button>
                </li>
              </ul>
            </TabsContainer>
            <HourlyView view={view} hourly={more.hourly} units={units} speedUnits={speedUnits}/>
            <div className="weather-more-hourly-view-time">
              {more.hourly.filter((_, index) => index % 3 === 1).map(item => (
                <div className="weather-more-hourly-view-time-item" key={item.id}>{item.time}</div>
              ))}
            </div>
          </div>
          <div className="container-footer weather-more-daily">
            {more.daily.map(item => (
              <div className="weather-more-daily-weekday" key={item.id}>
                <div className="weather-more-daily-weekday-name">{item.weekday}</div>
                <img src={item.icon} alt={item.description} title={item.description} className={`weather-more-daily-weekday-icon icon-${item.iconId}`} width="56px" height="56px" loading="lazy"/>
                <div className="weather-more-daily-weekday-temp">
                  <div>{Math.round(item.temperature.min)}°</div>
                  <div>{Math.round(item.temperature.max)}°</div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : message ? <p className="weather-more-message">{message}</p>
        : <Spinner size="48px"/>
      }
      <Dropdown container={{ className: "weather-more-settings" }} toggle={{ iconId: "settings", title: locale.global.settings }}>
        <label className="dropdown-group weather-more-setting">
          <div>{locale.weather.temp_setting_label}</div>
          <input type="checkbox" className="sr-only toggle-input"
            checked={units === "F"}
            onChange={() => toggleUnits("temp")}/>
          <div className="toggle">
            <div className="toggle-item">°C</div>
            <div className="toggle-item">°F</div>
          </div>
        </label>
        <label className="dropdown-group weather-more-setting">
          <div>{locale.weather.wind_setting_label}</div>
          <input type="checkbox" className="sr-only toggle-input"
            checked={speedUnits === "ft/s"}
            onChange={() => toggleUnits("wind")}/>
          <div className="toggle">
            <div className="toggle-item">m/s</div>
            <div className="toggle-item">ft/s</div>
          </div>
        </label>
      </Dropdown>
      <button className="btn icon-btn weather-more-close-btn" onClick={hide} title={locale.global.close}>
        <Icon id="cross"/>
      </button>
    </>
  );
}
