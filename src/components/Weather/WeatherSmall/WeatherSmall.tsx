import type { Ref } from "react";
import type { Current } from "types/weather";
import type { WeatherSettings } from "types/settings";
import Icon from "components/Icon";
import "./weather-small.css";

type Props = {
  current: Current,
  hidden?: boolean
  locale: any,
  settings: WeatherSettings
  moreButton: Ref<HTMLButtonElement>,
  showMoreWeather: () => void
}

export default function WeatherSmall({ current, hidden, locale, settings, showMoreWeather, moreButton }: Props) {
  const icon = `/assets/weather-icons/${current.iconId}.png`;

  return (
    <div className={`weather-small${hidden ? " hidden" : ""}`}>
      <button className="btn icon-btn weather-more-btn" onClick={showMoreWeather} ref={moreButton} title={locale.global.more}>
        <Icon id="expand" />
      </button>
      <div className="weather-current">
        <div className="weather-temperature-icon-container">
          <div className="weather-temperature">
            <span className="weather-temperature-value">{Math.round(current.temperature)}</span>
            <span className="weather-temperature-units">°{settings.units}</span>
          </div>
          <img src={icon} className={`weather-icon icon-${current.iconId}`} width="80px" height="80px" alt="" />
        </div>
        <div className="weather-location">{current.location}</div>
      </div>
    </div>
  );
}
