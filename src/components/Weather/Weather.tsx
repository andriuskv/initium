import type { Current, Hour, Weekday } from "types/weather";
import { useState, useEffect, useLayoutEffect, useRef, lazy, Suspense, type CSSProperties } from "react";
import { dispatchCustomEvent } from "utils";
import * as focusService from "services/focus";
import { fetchWeather, fetchMoreWeather, updateWeekdayLocale, convertTemperature, convertWindSpeed } from "services/weather";
import { getTimeString } from "services/timeDate";
import { handleZIndex, increaseZIndex } from "services/zIndex";
import { useSettings } from "contexts/settings";
import Icon from "components/Icon";
import "./weather.css";

type Props = {
  timeFormat: 12 | 24,
  corner: string,
  locale: any
}

const MoreWeather = lazy(() => import("./MoreWeather"));

export default function Weather({ timeFormat, corner, locale }: Props) {
  const { settings: { appearance: { animationSpeed }, timeDate: { dateLocale }, weather: settings }, updateContextSetting } = useSettings();
  const [state, setState] = useState({ visible: false, rendered: false, reveal: false });
  const [current, setCurrentWeather] = useState<Current | null>(null);
  const [moreWeather, setMoreWeather] = useState<{ hourly: Hour[], daily: Weekday[]} | null>(null);
  const [moreWeatherMessage, setMoreWeatherMessage] = useState("");
  const firstRender = useRef(true);
  const lastMoreWeatherUpdate = useRef(0);
  const timeoutId = useRef(0);
  const moreButton = useRef<HTMLButtonElement>(null);

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
    if (!moreWeather) {
      return;
    }
    setMoreWeather({ ...moreWeather, daily: updateWeekdayLocale(moreWeather.daily, dateLocale) });
  }, [dateLocale]);

  useEffect(() => {
    if (moreWeather) {
      setMoreWeather({
        ...moreWeather,
        hourly: [...moreWeather.hourly.map(item => {
          item.time = getTimeString({ hours: item.hour, minutes: 0 });
          return item;
        })]
      });
    }
  }, [timeFormat]);

  useEffect(() => {
    if (state.rendered && state.reveal) {
      setState({ ...state, visible: true });
    }
  }, [state.rendered, state.reveal]);


  useEffect(() => {
    if (current && state.visible) {
      updateMoreWeather(current.coords);
    }
  }, [current, state.visible]);

  useLayoutEffect(() => {
    if (state.reveal) {
      setTimeout(() => {
        focusService.focusSelector(".weather-more-close-btn");
      }, 50);
    }
    else {
      moreButton.current?.focus();
    }
  }, [state.reveal]);

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

  function scheduleWeatherUpdate() {
    timeoutId.current = window.setTimeout(updateWeather, 1200000);
  }

  function hideMoreWeather() {
    setState({ ...state, visible: false });

    setTimeout(() => {
      setState({ ...state, visible: false, reveal: false });
    }, 320 * animationSpeed);
  }

  function show() {
    if (!state.rendered) {
      setState({ rendered: true, reveal: true, visible: false });
    }
    else {
      setState({ ...state, reveal: true });
    }
  }

  async function updateWeather(forceMoreWeatherUpdate = false) {
    try {
      const json = await fetchWeather() as Current;

      if (!json) {
        return;
      }

      if ("message" in json) {
        dispatchCustomEvent("weather-error", json);
      }
      else if (json.location) {
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

  async function updateMoreWeather(coords : { lat: number, lon: number }) {
    if (Date.now() - lastMoreWeatherUpdate.current < 1200000) {
      return;
    }
    try {
      lastMoreWeatherUpdate.current = Date.now();

      const json = await fetchMoreWeather(coords);

      setMoreWeather({
        hourly: json.hourly,
        daily: json.daily
      });
      setMoreWeatherMessage("");

    }
    catch (e) {
      console.log(e);
      setMoreWeatherMessage("Failed to update weather. Will try again later.");
    }
  }

  if (!current) {
    return null;
  }
  return (
    <div className={`weather ${corner}`} style={{ "--z-index": increaseZIndex("weather") } as CSSProperties} onClick={event => handleZIndex(event, "weather")}>
      <div className={`weather-small${state.reveal ? " hidden" : ""}`}>
        <button className="btn icon-btn weather-more-btn" onClick={show} ref={moreButton} title={locale.global.more}>
          <Icon id="expand"/>
        </button>
        <div className="weather-current">
          <div className="weather-temperature-icon-container">
            <div className="weather-temperature">
              <span className="weather-temperature-value">{Math.round(current.temperature)}</span>
              <span className="weather-temperature-units">°{settings.units}</span>
            </div>
            <img src={current.icon} className={`weather-icon icon-${current.iconId}`} width="80px" height="80px" alt=""/>
          </div>
          <div className="weather-location">{current.location}</div>
        </div>
      </div>
      <div className={`container weather-more${state.visible ? " visible" : ""}${state.reveal ? " reveal" : ""} corner-item`}>
        <div className="weather-transition-target weather-more-info">
          <Suspense fallback={null}>
            {state.rendered && <MoreWeather current={current} more={moreWeather} units={settings.units} speedUnits={settings.speedUnits}
              message={moreWeatherMessage} locale={locale} toggleUnits={toggleUnits} hide={hideMoreWeather}/>}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
