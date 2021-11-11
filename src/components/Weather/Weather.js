import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { dispatchCustomEvent } from "utils";
import { fetchWeather, fetchHourlyWeather, convertTemperature } from "services/weather";
import { getTimeString } from "services/timeDate";
import { getIincreasedZIndex, handleZIndex } from "services/zIndex";
import Icon from "../Icon";
import "./weather.css";

const MoreWeather = lazy(() => import("./MoreWeather"));

export default function Weather({ settings, timeFormat }) {
  const [current, setCurrentWeather] = useState(null);
  const [hourly, setHourlyWeather] = useState(null);
  const [moreWeather, setMoreWeather] = useState({ rendered: false });
  const firstRender = useRef(true);
  const lastHourlyWeatherUpdate = useRef(0);
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

  useEffect(() => {
    if (current) {
      setCurrentWeather({
        ...current,
        temperature: convertTemperature(current.temperature, settings.units)
      });

      if (hourly) {
        setHourlyWeather([...hourly.map(item => {
          item.temperature = convertTemperature(item.temperature, settings.units);
          return item;
        })]);
      }
    }
  }, [settings.units]);

  useEffect(() => {
    if (hourly) {
      setHourlyWeather([...hourly.map(item => {
        item.time = getTimeString({ hours: item.hour });
        return item;
      })]);
    }
  }, [timeFormat]);

  useEffect(() => {
    if (moreWeather.reveal) {
      moreWeather.visible = true;
      setMoreWeather({ ...moreWeather });
    }
  }, [moreWeather.reveal]);

  function scheduleWeatherUpdate() {
    timeoutId.current = setTimeout(updateWeather, 1200000);
  }

  function showMoreWeather() {
    zIndex.current = getIincreasedZIndex();
    moreWeather.reveal = true;

    setMoreWeather({ ...moreWeather });
    updateHourlyWeather(current.coords);
  }

  function hideMoreWeather() {
    moreWeather.visible = false;
    setMoreWeather({ ...moreWeather });

    setTimeout(() => {
      setMoreWeather({});
    }, 320);
  }

  async function updateWeather(forceHourlyUpdate = false) {
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

        if (forceHourlyUpdate) {
          lastHourlyWeatherUpdate.current = 0;
        }

        if (moreWeather.visible) {
          updateHourlyWeather(json.coords);
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

  async function updateHourlyWeather(coords) {
    if (Date.now() - lastHourlyWeatherUpdate.current < 1200000) {
      return;
    }
    try {
      const json = await fetchHourlyWeather(coords);

      setHourlyWeather(json);
      lastHourlyWeatherUpdate.current = Date.now();
    }
    catch (e) {
      console.log(e);
    }
  }

  if (!current) {
    return null;
  }
  else if (moreWeather.reveal) {
    return (
      <div className="weather" style={{ "--z-index": zIndex.current }} onClick={handleZIndex}>
        <div className={`container weather-more${moreWeather.visible ? " visible" : ""}`}>
          <Suspense fallback={null}>
            <MoreWeather current={current} hourly={hourly} units={settings.units} hide={hideMoreWeather}/>
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
            <span className="weather-temperature-value">{current.temperature}</span>
            <span className="weather-temperature-units">°{settings.units}</span>
          </div>
          <img src={current.icon} className="weather-icon" width="80px" height="80px" alt=""/>
        </div>
        <div className="weather-city">{current.city}</div>
      </div>
    </div>
  );
}
