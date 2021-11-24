import { useState, useEffect } from "react";
import { useSettings } from "contexts/settings-context";
import "./weather-tab.css";

export default function WeatherTab() {
  const { settings: { weather: settings }, updateSetting, toggleSetting } = useSettings();
  const [error, setError] = useState(null);

  useEffect(() => {
    window.addEventListener("weather-error", handleWeatherError);

    return () => {
      window.removeEventListener("weather-error", handleWeatherError);
    };
  }, []);

  function handleWeatherError({ detail }) {
    setError(detail);
  }

  function toggleTemperatureUnits() {
    const { units } = settings;

    updateSetting("weather", { units: units === "C" ? "F" : "C" });
  }

  function handleCityNameChange(event) {
    event.preventDefault();
    updateSetting("weather", { cityName: event.target.elements.cityName.value });
  }

  return (
    <div className="setting-tab">
      {error?.type === "general" && <div className="weather-setting-message weather-settings-message">{error.message}</div>}
      <label className="checkbox-container setting">
        <span>Disable weather</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.disabled}
          onChange={() => toggleSetting("weather", "disabled")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <div className={`setting${settings.disabled ? " disabled" : ""}`}>
        <label className="checkbox-container setting-weather-item">
          <span>Use geolocation</span>
          <input type="checkbox" className="sr-only checkbox-input"
            disabled={settings.disabled}
            checked={settings.useGeo}
            onChange={() => toggleSetting("weather", "useGeo")}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
        </label>
        {error?.type === "geo" && <div className="weather-setting-message">{error.message}</div>}
      </div>
      <label className={`setting${settings.disabled ? " disabled" : ""}`}>
        <span>Temperature units</span>
        <input type="checkbox" className="sr-only toggle-input"
          disabled={settings.disabled}
          checked={settings.units === "F"}
          onChange={toggleTemperatureUnits}/>
        <div className="toggle">
          <div className="toggle-item">°C</div>
          <div className="toggle-item">°F</div>
        </div>
      </label>
      <form className={`setting${settings.disabled || settings.useGeo ? " disabled" : ""}`}
        onSubmit={handleCityNameChange}>
        <span>City name (and country code)</span>
        <input type="text" className="input setting-input" placeholder="Paris,FR" name="cityName"
          autoComplete="off" disabled={settings.disabled || settings.useGeo} defaultValue={settings.cityName}/>
        {error?.type === "target" && <div className="setting-message">{error.message}</div>}
      </form>
    </div>
  );
}
