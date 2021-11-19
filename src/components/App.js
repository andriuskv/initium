import { useState, useEffect, useLayoutEffect, useRef, lazy, Suspense } from "react";
import { useSettings } from "../contexts/settings-context";
import Background from "./Background";
import Tasks from "./Tasks";
import BottomPanel from "./BottomPanel";

const Clock = lazy(() => import("./Clock"));
const Greeting = lazy(() => import("./Greeting"));
const GreetingEditor = lazy(() => import("./GreetingEditor"));
const MainPanel = lazy(() => import("./MainPanel"));
const TopPanel = lazy(() => import("./TopPanel"));
const Weather = lazy(() => import("./Weather"));
const BackgroundViewer = lazy(() => import("./BackgroundViewer"));
const TweetImageViewer = lazy(() => import("./TweetImageViewer"));

export default function App() {
  const { settings } = useSettings();
  const [backgroundViewerVisible, setBackgroundViewerVisible] = useState(false);
  const [tweetImageData, setTweetImageData] = useState(null);
  const [topPanel, setTopPanel] = useState({ rendered: false, forceVisibility: false });
  const [greeting, setGreeting] = useState(null);
  const [weather, setWeather] = useState(() => ({ rendered: false, shouldDelay: isWeatherEnabled() }));
  const topPanelTimeoutId = useRef(0);
  const weatherTimeoutId = useRef(0);

  useLayoutEffect(() => {
    document.body.style.setProperty("--background-opacity", `${settings.general.backgroundOpacity}%`);
    document.body.style.setProperty("--background-blur", `${settings.general.backgroundBlurRadius}px`);
  }, []);

  useEffect(() => {
    initGreeting();
    initTopPanel();

    window.addEventListener("background-viewer-visible", showBackgroundViewer);
    window.addEventListener("tweet-image-viewer-visible", showTweetImageViewer);
    window.addEventListener("greeting-editor-visible", showGreetingEditor);
    window.addEventListener("top-panel-visible", renderTopPanel, { once: true });

    return () => {
      window.removeEventListener("background-viewer-visible", showBackgroundViewer);
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

  function showBackgroundViewer() {
    setBackgroundViewerVisible(true);
  }

  function hideBackgroundViewer() {
    setBackgroundViewerVisible(false);
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
      <Background settings={settings.background}/>
      <div className="middle-top">
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
        {greeting?.editorVisible ? <GreetingEditor hide={hideGreetingEditor}/> : null}
      </Suspense>
      <Suspense fallback={null}>
        {topPanel.rendered && <TopPanel forceVisibility={topPanel.forceVisibility}/>}
        {weather.rendered && <Weather settings={settings.weather} timeFormat={settings.timeDate.format}/>}
        {backgroundViewerVisible && <BackgroundViewer settings={settings.background} hide={hideBackgroundViewer}/>}
        {tweetImageData && <TweetImageViewer data={tweetImageData} hide={hideTweetImageViewer}/>}
      </Suspense>
      <BottomPanel/>
      <Tasks/>
    </>
  );
}
