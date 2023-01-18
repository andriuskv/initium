import { useState, useEffect, useLayoutEffect, useRef, lazy, Suspense } from "react";
import { dispatchCustomEvent } from "utils";
import { fetchWeather, fetchMoreWeather, convertTemperature, convertWindSpeed } from "services/weather";
import { getTimeString } from "services/timeDate";
import { getIincreasedZIndex, handleZIndex } from "services/zIndex";
import { useSettings } from "contexts/settings-context";
import Icon from "../Icon";
import "./weather.css";

const MoreWeather = lazy(() => import("./MoreWeather"));

export default function Weather({ timeFormat }) {
  const { settings: { weather: settings }, updateSetting } = useSettings();
  const [state, setState] = useState({ view: "temp" });
  const [current, setCurrentWeather] = useState(null);
  const [moreWeather, setMoreWeather] = useState(null);
  const firstRender = useRef(true);
  const lastMoreWeatherUpdate = useRef(0);
  const timeoutId = useRef(0);
  const zIndex = useRef(0);

  useEffect(() => {
    if (firstRender.current) {
      updateWeather();
    }
    else if (settings.cityName || settings.useGeo) {
      updateWeather(true);
    }
    else {
      setCurrentWeather(null);
    }
    firstRender.current = false;

    return () => {
      clearTimeout(timeoutId.current);
    };
  }, [settings.cityName, settings.useGeo]);

  useLayoutEffect(() => {
    if (current) {
      setCurrentWeather({
        ...current,
        temperature: convertTemperature(current.temperature, settings.units)
      });

      if (moreWeather) {
        setMoreWeather({
          hourly: [...moreWeather.hourly.map(item => {
            item.temperature = convertTemperature(item.temperature, settings.units);
            return item;
          })],
          daily: [...moreWeather.daily.map(item => {
            item.temperature = {
              min: convertTemperature(item.temperature.min, settings.units),
              max: convertTemperature(item.temperature.max, settings.units)
            };
            return item;
          })]
        });
      }
    }
  }, [settings.units]);

  useEffect(() => {
    if (current) {
      setCurrentWeather({
        ...current,
        wind: {
          ...current.wind,
          speed: convertWindSpeed(current.wind.speed, settings.speedUnits)
        }
      });

      if (moreWeather) {
        setMoreWeather({
          hourly: [...moreWeather.hourly.map(item => {
            item.wind.speed = convertWindSpeed(item.wind.speed, settings.speedUnits);
            return item;
          })],
          daily: moreWeather.daily
        });
      }
    }
  }, [settings.speedUnits]);

  useEffect(() => {
    if (moreWeather) {
      setMoreWeather({
        ...moreWeather,
        hourly: [...moreWeather.hourly.map(item => {
          item.time = getTimeString({ hours: item.hour });
          return item;
        })]
      });
    }
  }, [timeFormat]);

  useEffect(() => {
    if (state.reveal) {
      state.visible = true;
      setState({ ...state });
    }
  }, [state.reveal]);

  useEffect(() => {
    if (current && state.visible) {
      updateMoreWeather(current.coords);
    }
  }, [current, state.visible]);

  function toggleUnits(type) {
    if (type === "temp") {
      const { units } = settings;

      updateSetting("weather", { units: units === "C" ? "F" : "C" });
    }
    else if (type === "wind") {
      const { speedUnits } = settings;

      updateSetting("weather", { speedUnits: speedUnits === "m/s" ? "ft/s" : "m/s" });
    }
  }

  function scheduleWeatherUpdate() {
    timeoutId.current = setTimeout(updateWeather, 1200000);
  }

  function showMoreWeather() {
    zIndex.current = getIincreasedZIndex();
    setState({ ...state, reveal: true });
  }

  function hideMoreWeather() {
    state.visible = false;
    setState({ ...state });

    setTimeout(() => {
      state.reveal = false;
      setState({ ...state });
    }, 320);
  }

  function selectView(view) {
    setState({ ...state, view });
  }

  async function updateWeather(forceMoreWeatherUpdate = false) {
    try {
      const json = await fetchWeather();

      if (!json) {
        return;
      }

      if (json.message) {
        dispatchCustomEvent("weather-error", json);
      }
      else {
        setCurrentWeather(json);

        if (forceMoreWeatherUpdate) {
          lastMoreWeatherUpdate.current = 0;
        }
      }
    }
    catch (e) {
      console.log(e);
    }
    finally {
      scheduleWeatherUpdate();
    }
  }

  async function updateMoreWeather(coords) {
    if (Date.now() - lastMoreWeatherUpdate.current < 1200000) {
      return;
    }
    try {
      lastMoreWeatherUpdate.current = Date.now();

      const json = await fetchMoreWeather(coords);

      setCurrentWeather({ ...current, precipitation: json.hourly[0].precipitation });
      setMoreWeather({
        hourly: json.hourly,
        daily: json.daily
      });
    }
    catch (e) {
      console.log(e);
    }
  }

  if (!current) {
    return null;
  }
  else if (state.reveal) {
    return (
      <div className="weather" style={{ "--z-index": zIndex.current }} onClick={handleZIndex}>
        <div className={`container weather-more${state.visible ? " visible" : ""}`}>
          <Suspense fallback={null}>
            <MoreWeather current={current} more={moreWeather} units={settings.units} speedUnits={settings.speedUnits} view={state.view}
              selectView={selectView} toggleUnits={toggleUnits} hide={hideMoreWeather}/>
          </Suspense>
        </div>
      </div>
    );
  }
  return (
    <div className="weather">
      <button className="btn icon-btn weather-more-btn" onClick={showMoreWeather} title="More">
        <Icon id="expand"/>
      </button>
      <div className="weather-current">
        <div className="weather-temperature-icon-container">
          <div className="weather-temperature">
            <span className="weather-temperature-value">{Math.round(current.temperature)}</span>
            <span className="weather-temperature-units">°{settings.units}</span>
          </div>
          <img src={current.icon} className="weather-icon" width="80px" height="80px" alt=""/>
        </div>
        <div className="weather-city">{current.city}</div>
      </div>
    </div>
  );
}
