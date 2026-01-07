import type { Current, More } from "types/weather";
import { useState, useEffect, useLayoutEffect, useRef, lazy, Suspense, type CSSProperties } from "react";
import { dispatchCustomEvent } from "utils";
import * as focusService from "services/focus";
import { fetchWeather, fetchMoreWeather, getHourlyTime, updateWeekdayLocale, convertTemperature, convertWindSpeed } from "services/weather";
import { getWidgetState, setWidgetState, handleZIndex, initElementZindex, increaseElementZindex } from "services/widgetStates";
import { useLocalization } from "contexts/localization";
import { useSettings } from "contexts/settings";
import "./weather.css";
import WeatherSmall from "./WeatherSmall";

const MoreWeather = lazy(() => import("./MoreWeather"));

const UPDATE_INTERVAL = 840000;

type Props = {
  timeFormat: 12 | 24,
  corner: string,
}

export default function Weather({ timeFormat, corner }: Props) {
  const locale = useLocalization();
  const { settings: { general: { rememberWidgetState }, appearance: { animationSpeed }, timeDate: { dateLocale }, weather: settings } } = useSettings();
  const [state, setState] = useState(() => {
    if (rememberWidgetState) {
      const { opened } = getWidgetState("weather");
      return { visible: opened, rendered: opened, reveal: opened };
    }
    return { visible: false, rendered: false, reveal: false };
  });
  const [current, setCurrentWeather] = useState<Current | null>(null);
  const [moreWeather, setMoreWeather] = useState<More | null>(null);
  const [moreWeatherMessage, setMoreWeatherMessage] = useState("");
  const [updatingMoreWeather, setUpdatingMoreWeather] = useState(true);
  const firstRender = useRef(true);
  const moreUpdateNeeded = useRef(false);
  const timeoutId = useRef(0);
  const moreButton = useRef<HTMLButtonElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const widgetState = getWidgetState("weather");
  const [moved, setMoved] = useState(widgetState.moved);

  useEffect(() => {
    function handleMoveInit({ detail: { weather } }: CustomEventInit) {
      if (weather) {
        setMoved(weather.moved);
      }
    }
    window.addEventListener("widget-move-init", handleMoveInit);

    return () => {
      window.removeEventListener("widget-move-init", handleMoveInit);
    };
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      updateWeather();
    }
    else if (current && (settings.cityName || settings.useGeo)) {
      updateWeather();
      moreUpdateNeeded.current = true;
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
          ...moreWeather,
          hourly: [...moreWeather.hourly.map(item => {
            item.temperature = convertTemperature(item.temperature, settings.units);
            item.tempC = settings.units === "C" ? item.temperature : convertTemperature(item.temperature, "C");
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
          ...moreWeather,
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
    setMoreWeather({
      ...moreWeather,
      daily: updateWeekdayLocale(moreWeather.daily, dateLocale)
    });
  }, [locale.locale, dateLocale]);

  useEffect(() => {
    if (moreWeather) {
      setMoreWeather({
        ...moreWeather,
        hourly: moreWeather.hourly.map(item => {
          return {
            ...item,
            ...getHourlyTime(item)
          };
        })
      });
    }
  }, [timeFormat]);

  useEffect(() => {
    if (state.rendered && state.reveal) {
      setState({ ...state, visible: true });
    }
  }, [state.rendered, state.reveal]);

  useEffect(() => {
    if (!current) {
      return;
    }
    initElementZindex(container.current, "weather");

    if (state.visible && (!moreWeather || moreUpdateNeeded.current)) {
      updateMoreWeather(current.coords);
      moreUpdateNeeded.current = false;
    }

    function handleTimeDateChange(event: CustomEventInit) {
      if (event.detail.unit === "hours" && current) {
        if (state.visible) {
          updateMoreWeather(current.coords);
        }
        else {
          moreUpdateNeeded.current = true;
        }
      }
    }

    window.addEventListener("timedate-change", handleTimeDateChange);

    return () => {
      window.removeEventListener("timedate-change", handleTimeDateChange);
    };
  }, [current, moreWeather, state.visible]);

  function scheduleWeatherUpdate() {
    timeoutId.current = window.setTimeout(updateWeather, UPDATE_INTERVAL);
  }

  function hideMoreWeather() {
    let duration = 300;

    setState({ ...state, visible: false });
    setWidgetState("weather", { opened: false });

    if (moved) {
      duration = 200;
    }
    setTimeout(() => {
      setState({ ...state, visible: false, reveal: false });
      requestAnimationFrame(() => requestAnimationFrame(() => {
        moreButton.current?.focus();
      }));
    }, duration * animationSpeed);
  }

  function showMoreWeather() {
    let opened = false;

    if (!state.rendered) {
      opened = true;
      setState({ rendered: true, reveal: true, visible: false });
    }
    else {
      const nextReveal = !state.reveal;

      if (nextReveal) {
        opened = true;
        setState({ ...state, reveal: nextReveal, visible: false });
        increaseElementZindex(container.current, "weather");
      }
      else {
        opened = false;
        setState({ ...state, visible: false });
        setTimeout(() => {
          setState({ ...state, visible: false, reveal: false });
        }, 200 * animationSpeed);
      }
    }
    setWidgetState("weather", { opened });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      focusService.focusSelector(".weather-more-close-btn");
    }));
  }

  async function updateWeather() {
    try {
      dispatchCustomEvent("weather-update", { status: "loading" });
      const json = await fetchWeather() as Current;

      if (!json) {
        return;
      }

      if ("message" in json) {
        dispatchCustomEvent("weather-update", { status: "error", data: json });
        return;
      }
      else if (json.location) {
        dispatchCustomEvent("weather-update", { status: "done" });
        setCurrentWeather(json);
      }
    }
    catch (e) {
      console.log(e);
    }
    finally {
      scheduleWeatherUpdate();
    }
  }

  async function updateMoreWeather(coords: { lat: number, lon: number }) {
    try {
      setUpdatingMoreWeather(true);

      const json = await fetchMoreWeather(coords, settings.units);

      setMoreWeather({
        updated: Date.now(),
        hourly: json.hourly,
        daily: json.daily
      });
      setMoreWeatherMessage("");
      setUpdatingMoreWeather(false);
    }
    catch (e) {
      console.log(e);
      setMoreWeatherMessage(locale.weather.failed_update_message);
      setUpdatingMoreWeather(false);
    }
  }

  if (!current) {
    return null;
  }
  return (
    <>
      {moved ? (
        <div className={`weather placement-${corner}`} onClick={event => handleZIndex(event, "weather")}>
          <WeatherSmall current={current} locale={locale} settings={settings} moreButton={moreButton} showMoreWeather={showMoreWeather} />
        </div>
      ) : null}
      <div className={`weather placement-${corner}${moved ? " moved" : ""}`} onClick={event => handleZIndex(event, "weather")}
        style={{ "--x": `${widgetState.x}%`, "--y": `${widgetState.y}%` } as CSSProperties} data-move-target="weather" ref={container}>
        {moved ? null : <WeatherSmall current={current} locale={locale} settings={settings} moreButton={moreButton} hidden={state.reveal} showMoreWeather={showMoreWeather} />
        }
        <div className={`container weather-more${state.visible ? " visible" : ""}${state.reveal ? " reveal" : ""} corner-item`}>
          <div className="weather-transition-target weather-more-info">
            <Suspense fallback={null}>
              {state.rendered && <MoreWeather current={current} more={moreWeather} units={settings.units} speedUnits={settings.speedUnits}
                message={moreWeatherMessage} updating={updatingMoreWeather} locale={locale} hide={hideMoreWeather} />}
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
