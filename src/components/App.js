import { useState, useEffect, useLayoutEffect, useRef, lazy, Suspense } from "react";
import { initAppearanceSettings } from "services/settings";
import { useSettings } from "contexts/settings-context";
import Wallpaper from "components/Wallpaper";
import BottomPanel from "components/BottomPanel";

const Clock = lazy(() => import("./Clock"));
const Greeting = lazy(() => import("./Greeting"));
const GreetingEditor = lazy(() => import("./GreetingEditor"));
const MainPanel = lazy(() => import("./MainPanel"));
const TopPanel = lazy(() => import("./TopPanel"));
const Weather = lazy(() => import("./Weather"));
const Tasks = lazy(() => import("./Tasks"));
const WallpaperViewer = lazy(() => import("./WallpaperViewer"));
const TweetImageViewer = lazy(() => import("./TweetImageViewer"));

export default function App() {
  const { settings } = useSettings();
  const [wallpaperViewerVisible, setWallpaperViewerVisible] = useState(false);
  const [tweetImageData, setTweetImageData] = useState(null);
  const [topPanel, setTopPanel] = useState({ rendered: false, forceVisibility: false });
  const [greeting, setGreeting] = useState(null);
  const [shouldCenterClock, setShouldCenterClock] = useState(() => getClockCenterState());
  const [weather, setWeather] = useState(() => ({ rendered: false, shouldDelay: isWeatherEnabled() }));
  const topPanelTimeoutId = useRef(0);
  const weatherTimeoutId = useRef(0);

  useLayoutEffect(() => {
    initAppearanceSettings(settings.appearance);
  }, []);

  useLayoutEffect(() => {
    setShouldCenterClock(getClockCenterState());
  }, [settings.mainPanel, settings.general]);

  useEffect(() => {
    initGreeting();
    initTopPanel();

    window.addEventListener("wallpaper-viewer-visible", showWallpaperViewer);
    window.addEventListener("tweet-image-viewer-visible", showTweetImageViewer);
    window.addEventListener("greeting-editor-visible", showGreetingEditor);
    window.addEventListener("top-panel-visible", renderTopPanel, { once: true });

    localStorage.removeItem("downscaled-background");
    localStorage.removeItem("background-info");
    localStorage.removeItem("twitter-highlight-color");

    caches.keys().then(keys => {
      keys.forEach(key => {
        if (key === "background-image-cache") {
          caches.delete(key);
        }
      });
    });

    return () => {
      window.removeEventListener("wallpaper-viewer-visible", showWallpaperViewer);
      window.removeEventListener("tweet-image-viewer-visible", showTweetImageViewer);
      window.removeEventListener("greeting-editor-visible", showGreetingEditor);
    };
  }, []);

  useEffect(() => {
    const shouldRender = isWeatherEnabled();

    clearTimeout(weatherTimeoutId.current);

    if (shouldRender) {
      if (weather.shouldDelay) {
        weatherTimeoutId.current = setTimeout(() => {
          setWeather({ rendered: true });
        }, 4000);
      }
      else {
        setWeather({ rendered: true });
      }
    }
    else if (weather.rendered) {
      setWeather({ rendered: false });
    }
  }, [settings.weather]);

  function getClockCenterState() {
    if (settings.mainPanel.disabled || (settings.mainPanel.navHidden && !localStorage.getItem("mainPanelTab"))) {
      return settings.general.centerClock;
    }
    return false;
  }

  function isWeatherEnabled() {
    return !settings.weather.disabled && (settings.weather.cityName || settings.weather.useGeo);
  }

  async function initGreeting() {
    const chromeStorage = await import("../services/chromeStorage");
    const greetings = await chromeStorage.get("greetings");

    if (greetings?.length) {
      setGreeting({ visible: true });
    }
  }

  async function initTopPanel() {
    const chromeStorage = await import("../services/chromeStorage");
    const countdowns = await chromeStorage.get("countdowns");

    if (countdowns?.length) {
      topPanelTimeoutId.current = setTimeout(() => {
        setTopPanel({ rendered: true });
      }, 4000);
    }
  }

  function showWallpaperViewer() {
    setWallpaperViewerVisible(true);
  }

  function hideWallpaperViewer() {
    setWallpaperViewerVisible(false);
  }

  function showTweetImageViewer({ detail }) {
    setTweetImageData(detail);
  }

  function hideTweetImageViewer() {
    setTweetImageData(null);
  }

  function showGreetingEditor() {
    setGreeting({ ...greeting, editorVisible: true });
  }

  function hideGreetingEditor() {
    setGreeting({ ...greeting, editorVisible: false });
  }

  function renderTopPanel() {
    clearTimeout(topPanelTimeoutId.current);
    setTopPanel({ rendered: true, forceVisibility: true });
  }

  return (
    <>
      <Wallpaper settings={settings.appearance.wallpaper}/>
      <div className={`middle-top${shouldCenterClock ? " full-height": ""}${settings.timeDate.clockDisabled ? " clock-disabled" : ""}`}>
        <Suspense fallback={null}>
          {settings.timeDate.clockDisabled ? null : <Clock settings={settings.timeDate}/>}
        </Suspense>
        <Suspense fallback={null}>
          {settings.general.greetingDisabled || !greeting || greeting.editorVisible ? null : (
            <Greeting settings={settings.greeting}/>
          )}
        </Suspense>
      </div>
      <Suspense fallback={null}>
        {settings.mainPanel.disabled ? null : <MainPanel settings={settings.mainPanel}/>}
      </Suspense>
      <Suspense fallback={null}>
        {topPanel.rendered && <TopPanel forceVisibility={topPanel.forceVisibility}/>}
        {weather.rendered && <Weather timeFormat={settings.timeDate.format}/>}
        {wallpaperViewerVisible && <WallpaperViewer settings={settings.appearance.wallpaper} hide={hideWallpaperViewer}/>}
        {tweetImageData && <TweetImageViewer data={tweetImageData} hide={hideTweetImageViewer}/>}
      </Suspense>
      <BottomPanel/>
      <Suspense fallback={null}>
        {settings.general.tasksDisabled ? null : <Tasks/>}
      </Suspense>
      <Suspense fallback={null}>
        {greeting?.editorVisible ? <GreetingEditor hide={hideGreetingEditor}/> : null}
      </Suspense>
    </>
  );
}
