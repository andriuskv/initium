import { useState, useEffect } from "react";
import Icon from "components/Icon";
import Spinner from "components/Spinner";
import "./more-weather.css";

export default function MoreWeather({ current, more, units, view, selectView, hide }) {
  const [ready, setReady] = useState(false);
  const [maxHourlyTemp, setMaxHourlyTemp] = useState();

  useEffect(() => {
    if (!more) {
      return;
    }
    const maxHourlyTemp = more.hourly.reduce((max, item) => {
      if (item.temperature > max) {
        max = item.temperature;
      }
      return max;
    }, -Infinity);

    setReady(true);
    setMaxHourlyTemp(maxHourlyTemp);
  }, [more]);

  function getTempPath(closePath) {
    let path = "";

    for (const [index, item] of Object.entries(more.hourly)) {
      const y = getSvgY(item.temperature);

      // 576 = container width; 24 = item count
      // 24 = 576 / 24
      path += ` L${Number(index) * 24} ${y}`;
    }

    if (closePath) {
      return `M${path.slice(2)} L576 100 L0 100 Z`;
    }
    return `M${path.slice(2)}`;
  }

  function getSvgY(current, offset = 0) {
    return (100 - ((current / (maxHourlyTemp + maxHourlyTemp * 0.5)) * 100) - offset).toFixed(2);
  }

  function renderWindView(items) {
    const [minSpeed, maxSpeed] = items.reduce(([minSpeed, maxSpeed], item) => {
      if (item.wind.speed > maxSpeed) {
        maxSpeed = item.wind.speed;
      }

      if (item.wind.speed < minSpeed) {
        minSpeed = item.wind.speed;
      }
      return [minSpeed, maxSpeed];
    }, [Infinity, -Infinity]);

    return (
      <div className="weather-more-hourly-view weather-more-hourly-wind-view">
        {items.map(({ id, wind }) => {
          let ratio = 1;

          if (minSpeed !== maxSpeed) {
            ratio = (wind.speed - minSpeed) / (maxSpeed - minSpeed);
          }
          return (
            <div className="weather-more-hourly-wind-view-item" key={id}>
              <div className="weather-more-hourly-wind-view-item-speed">{wind.speed} m/s</div>
              <svg viewBox="0 0 24 24" className="weather-more-hourly-wind-view-item-icon"
                style={{ "--degrees": wind.direction.degrees, "--ratio": ratio }}>
                <title>{wind.direction.name}</title>
                <use href="#arrow-up"></use>
              </svg>
            </div>
          );
        })}
      </div>
    );
  }

  function renderTempValues() {
    return more.hourly.filter((_, index) => index % 3 === 1).map((item, index) => {
      const x = `calc(${index * 72 + 36}px - ${item.temperature.toString().length / 2}ch)`;
      const y = `${getSvgY(item.temperature, 10)}px`;

      return <text className=" weather-more-hourly-temp-view-text" style={{ transform: `translate(${x}, ${y})` }}
        key={item.id}>{item.temperature}°</text>;
    });
  }

  function renderHourlyView() {
    if (view === "temp") {
      return (
        <svg className="weather-more-hourly-view weather-more-hourly-temp-view">
          {renderTempValues()}
          <path className=" weather-more-hourly-temp-view-path"
            fill="none" stroke="var(--color-primary)" strokeWidth="2px" d={getTempPath()}></path>
          <path className=" weather-more-hourly-temp-view-path"
            fill="var(--color-primary-0-40)" d={getTempPath(true)}></path>
        </svg>
      );
    }
    else if (view === "prec") {
      return (
        <div className="weather-more-hourly-view">
          <div className="weather-more-hourly-prec-view-values">
            {more.hourly.filter((_, index) => index % 3 === 1).map(item => (
              <div className="weather-more-hourly-prec-view-value" key={item.id}>{item.precipitation}%</div>
            ))}
          </div>
          <div className="weather-more-hourly-prec-view-graph">
            {more.hourly.slice(0, -1).map(item => (
              <div className="weather-more-hourly-prec-view-graph-bar" key={item.id} style={{ height: `${item.precipitation}%`}}></div>
            ))}
          </div>
        </div>
      );
    }
    else if (view === "wind") {
      return renderWindView(more.hourly.filter((_, index) => index % 3 === 1));
    }
    return null;
  }

  return (
    <div className="weather-transition-target weather-more-info">
      <div className="weather-more-current">
        <img src={current.icon} className="weather-more-current-icon" alt="" width="100px" height="100px" loading="lazy"/>
        <div className="weather-more-current-main">
          <div className="weather-more-current-city">{current.city}</div>
          <div className="weather-more-current-main-info">
            <div className="weather-more-current-temperature">
              <div className="weather-more-current-temperature-value">{current.temperature}</div>
              <div className="weather-more-current-temperature-units">°{units}</div>
            </div>
            <div className="weather-more-current-secondary">
              <div className="weather-more-current-secondary-item">
                <span className="weather-more-current-secondary-name">Precipitation:</span>
                <span>{current.precipitation ?? 0}%</span>
              </div>
              <div className="weather-more-current-secondary-item">
                <span className="weather-more-current-secondary-name">Humidity:</span>
                <span>{current.humidity}%</span>
              </div>
              <div className="weather-more-current-secondary-item">
                <span className="weather-more-current-secondary-name">Wind:</span>
                <span className="weather-more-current-wind">
                  <span>{current.wind.speed} m/s</span>
                  <svg viewBox="0 0 24 24" className="weather-more-current-wind-icon"
                    style={{ "--degrees": current.wind.direction.degrees }}>
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
      {ready ? (
        <>
          <div className="weather-more-hourly-view-container">
            <ul className="weather-more-hourly-view-top">
              <li>
                <button className={`btn text-btn weather-more-hourly-view-top-btn${view === "temp" ? " active" : ""}`}
                  onClick={() => selectView("temp")}>Temperature</button>
              </li>
              <li>
                <button className={`btn text-btn weather-more-hourly-view-top-btn${view === "prec" ? " active" : ""}`}
                  onClick={() => selectView("prec")}>Precipitation</button>
              </li>
              <li>
                <button className={`btn text-btn weather-more-hourly-view-top-btn${view === "wind" ? " active" : ""}`}
                  onClick={() => selectView("wind")}>Wind</button>
              </li>
            </ul>
            {renderHourlyView()}
            <div className="weather-more-hourly-view-time">
              {more.hourly.filter((_, index) => index % 3 === 1).map(item => (
                <div className="weather-more-hourly-view-time-item" key={item.id}>{item.time}</div>
              ))}
            </div>
          </div>
          <div className="weather-more-daily">
            {more.daily.map(item => (
              <div className="weather-more-daily-weekday" key={item.id}>
                <div className="weather-more-daily-weekday-name">{item.weekday}</div>
                <img src={item.icon} alt={item.description} width="64px" height="64px" loading="lazy"/>
                <div className="weather-more-daily-weekday-temp">
                  <div>{item.temperature.min}°</div>
                  <div>{item.temperature.max}°</div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : <Spinner className="weather-more-spinner"/>}
      <button className="btn icon-btn weather-more-hide-btn" onClick={hide} title="Hide">
        <Icon id="cross"/>
      </button>
    </div>
  );
}
