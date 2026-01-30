import type { CSSProperties } from "react";
import type { Current } from "types/weather";
import "./CurrentView.css";

type Props = {
  current: Current,
  units: "C" | "F",
  speedUnits: "m/s" | "ft/s",
  locale: any
}

export default function CurrentView({ current, units, speedUnits, locale }: Props) {
  const icon = `/assets/weather-icons/${current.iconId}.png`;

  return (
    <>
      <div className="weather-more-current-icon-container">
        <img src={icon} className={`weather-more-current-icon icon-${current.iconId}`} alt="" width="100px" height="100px" loading="lazy" />
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
              <span>{current.precipitation}%</span>
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
    </>
  );
}
