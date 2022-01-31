import Icon from "components/Icon";
import "./more-weather.css";

export default function MoreWeather({ current, hourly, units, hide }) {
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
      <div className="weather-more-hourly">
        {hourly?.map(item => (
          <div className="weather-more-hourly-item" key={item.id}>
            <div className="weather-more-hourly-time">{item.time}</div>
            <img src={item.icon} alt="" width="64px" height="64px" loading="lazy"/>
            <div className="weather-more-hourly-temperature">
              <div>{item.temperature}</div>
              <div className="weather-more-hourly-temperature-units">°{units}</div>
            </div>
          </div>
        ))}
      </div>
      <button className="btn icon-btn weather-more-hide-btn" onClick={hide} title="Hide">
        <Icon id="cross"/>
      </button>
    </div>
  );
}
