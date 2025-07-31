import { useState, useEffect, useRef, lazy, Suspense, type FC } from "react";
import { getRandomString } from "utils";
import { getWidgetState } from "services/widgetStates";
import { useSettings } from "contexts/settings";
import { usePlacement } from "contexts/placement";
import SecondaryPanel from "components/SecondaryPanel";
import "./placement.css";

const Weather = lazy(() => import("components/Weather"));
const Tasks = lazy(() => import("components/Tasks"));

type Component = {
  id: string,
  component: FC<any>,
  shouldSkip: boolean,
  params?: { [key: string]: unknown }
}

export default function Placement() {
  const { settings } = useSettings();
  const { placement } = usePlacement();
  const [weather, setWeather] = useState<{ rendered: boolean, shouldDelay?: boolean}>(() => ({
    rendered: false,
    shouldDelay: isWeatherEnabled()
  }));
  const weatherTimeoutId = useRef(0);
  const [components, setComponents] = useState<{ [key: string]: Component }>(() => ({
    weather: {
      id: getRandomString(),
      component: Weather,
      shouldSkip: !weather.rendered,
      params: { timeFormat: settings.timeDate.format }
    },
    tasks: {
      id: getRandomString(),
      component: Tasks,
      shouldSkip: settings.tasks.disabled,
      params: { settings: settings.tasks, generalSettings: settings.general }
    },
    secondary: {
      id: getRandomString(),
      component: SecondaryPanel,
      shouldSkip: false,
      params: {}
    }
  }));

  useEffect(() => {
    if (components.weather.shouldSkip === weather.rendered) {
      setComponents({
        ...components,
        weather: {
          ...components.weather,
          shouldSkip: !weather.rendered
        }
      });
    }
  }, [weather.rendered]);

  useEffect(() => {
    setComponents({
      ...components,
      tasks: {
        ...components.tasks,
        shouldSkip: settings.tasks.disabled,
        params: { ...components.tasks.params, settings: settings.tasks }
      }
    });
  }, [settings.tasks]);

  useEffect(() => {
    setComponents({
      ...components,
      weather: {
        ...components.weather,
        params: { ...components.weather.params, timeFormat: settings.timeDate.format },
        shouldSkip: !weather.rendered
      }
    });
  }, [settings.timeDate.format]);

  useEffect(() => {
    const shouldRender = isWeatherEnabled();
    const shouldSkipWaiting = settings.general.rememberWidgetState && getWidgetState("weather");

    clearTimeout(weatherTimeoutId.current);

    if (shouldRender) {
      if (weather.shouldDelay) {
        weatherTimeoutId.current = window.setTimeout(() => {
          setWeather({ rendered: true });
        }, shouldSkipWaiting ? 1 : 2000);
      }
      else {
        setWeather({ rendered: true });
      }
    }
    else if (weather.rendered) {
      setWeather({ rendered: false });
    }
  }, [settings.weather]);

  function isWeatherEnabled() {
    return !settings.weather.disabled && (!!settings.weather.cityName || settings.weather.useGeo);
  }

  return Object.entries(placement).map(([corner, value]) => {
    const item = components[value.id];

    if (item) {
      return (
        <Suspense fallback={null} key={item.id}>
          {item.shouldSkip ? null : <item.component { ...item.params} corner={corner}/>}
        </Suspense>
      );
    }
    return null;
  });
}
