import { useState, useEffect, useRef, lazy, Suspense, type FC } from "react";
import { getRandomString } from "utils";
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

export default function Placement({ locale }: { locale: any }) {
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
      params: { timeFormat: settings.timeDate.format, locale }
    },
    tasks: {
      id: getRandomString(),
      component: Tasks,
      shouldSkip: settings.tasks.disabled,
      params: { settings: settings.tasks, generalSettings: settings.general, locale }
    },
    secondary: {
      id: getRandomString(),
      component: SecondaryPanel,
      shouldSkip: false,
      params: { locale }
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
    const shouldRender = isWeatherEnabled();

    clearTimeout(weatherTimeoutId.current);

    if (shouldRender) {
      if (weather.shouldDelay) {
        weatherTimeoutId.current = window.setTimeout(() => {
          setWeather({ rendered: true });
        }, 2000);
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
