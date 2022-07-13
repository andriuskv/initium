import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { dispatchCustomEvent } from "utils";
import { fetchWeather, fetchMoreWeather, convertTemperature } from "services/weather";
import { getTimeString } from "services/timeDate";
import { getIincreasedZIndex, handleZIndex } from "services/zIndex";
import Icon from "../Icon";
import "./weather.css";

const MoreWeather = lazy(() => import("./MoreWeather"));

export default function Weather({ settings, timeFormat }) {
  const [state, setState] = useState({});
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

  useEffect(() => {
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

  function scheduleWeatherUpdate() {
    timeoutId.current = setTimeout(updateWeather, 1200000);
  }

  function showMoreWeather() {
    zIndex.current = getIincreasedZIndex();
    state.reveal = true;

    setState({ ...state });
    updateMoreWeather(current.coords);
  }

  function hideMoreWeather() {
    state.visible = false;
    setState({ ...state });

    setTimeout(() => {
      setState({});
    }, 320);
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
      const json = await fetchMoreWeather(coords);

      setCurrentWeather({ ...current, precipitation: json.hourly[0].precipitation });
      setMoreWeather({
        hourly: json.hourly,
        daily: json.daily
      });
      lastMoreWeatherUpdate.current = Date.now();
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
            <MoreWeather current={current} more={moreWeather} units={settings.units} hide={hideMoreWeather}/>
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
