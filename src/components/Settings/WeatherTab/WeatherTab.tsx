import { useState, useEffect, type FormEvent } from "react";
import { useSettings } from "contexts/settings";
import "./weather-tab.css";

type ErrorType = {
  type: "general" | "geo" | "target";
  message: string;
}

export default function WeatherTab({ locale }: { locale: any }) {
  const { settings: { weather: settings }, updateContextSetting, toggleSetting } = useSettings();
  const [error, setError] = useState<ErrorType | null>(null);

  useEffect(() => {
    function handleWeatherError({ detail }: CustomEventInit) {
      setError(detail);
    }

    window.addEventListener("weather-error", handleWeatherError);

    return () => {
      window.removeEventListener("weather-error", handleWeatherError);
    };
  }, []);

  function toggleTemperatureUnits() {
    const { units } = settings;

    updateContextSetting("weather", { units: units === "C" ? "F" : "C" });
  }

  function handleCityNameChange(event: FormEvent) {
    interface FormElements extends HTMLFormControlsCollection {
      cityName: HTMLInputElement;
    }

    const formElement = event.target as HTMLFormElement;
    const elements = formElement.elements as FormElements;

    event.preventDefault();
    updateContextSetting("weather", { cityName: elements.cityName.value });
  }

  return (
    <div className="container-body setting-tab">
      {error?.type === "general" && <div className="weather-setting-message weather-settings-message">{error.message}</div>}
      <label className="checkbox-container setting">
        <span>{locale.settings.weather.disable_weather_label}</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.disabled}
          onChange={() => toggleSetting("weather", "disabled")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <div className={`setting${settings.disabled ? " disabled" : ""}`}>
        <label className="checkbox-container setting-weather-item">
          <span>{locale.settings.weather.use_geo_label}</span>
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
        <span>{locale.settings.weather.temp_units_label}</span>
        <input type="checkbox" className="sr-only toggle-input"
          disabled={settings.disabled}
          checked={settings.units === "F"}
          onChange={toggleTemperatureUnits}/>
        <div className="toggle">
          <div className="toggle-item">°C</div>
          <div className="toggle-item">°F</div>
        </div>
      </label>
      <div className={`setting weather-location-setting${settings.disabled || settings.useGeo ? " disabled" : ""}`}>
        <form onSubmit={handleCityNameChange} className="weather-setting-location-form">
          <span>{locale.settings.weather.location_label}</span>
          <input type="text" className="input setting-input" placeholder="Paris,FR" name="cityName"
            autoComplete="off" disabled={settings.disabled || settings.useGeo} defaultValue={settings.cityName}/>
        </form>
        {error?.type === "target" && <p className="setting-message weather-setting-message">{error.message}</p>}
      </div>
    </div>
  );
}
