import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useSettings } from "../contexts/settings-context";
import Background from "./Background";
import Clock from "./Clock";
import MainPanel from "./MainPanel";
import Tasks from "./Tasks";
import BottomPanel from "./BottomPanel";

const TopPanel = lazy(() => import("./TopPanel"));
const Weather = lazy(() => import("./Weather"));
const BackgroundViewer = lazy(() => import("./BackgroundViewer"));
const TweetImageViewer = lazy(() => import("./TweetImageViewer"));

export default function App() {
  const { settings } = useSettings();
  const [backgroundViewerVisible, setBackgroundViewerVisible] = useState(false);
  const [tweetImageData, setTweetImageData] = useState(null);
  const [topPanel, setTopPanel] = useState({ rendered: false, forceVisibility: false });
  const [weather, setWeather] = useState(() => ({ rendered: false, shouldDelay: isWeatherEnabled() }));
  const topPanelTimeoutId = useRef(0);
  const weatherTimeoutId = useRef(0);

  useEffect(() => {
    initTopPanel();

    window.addEventListener("background-viewer-visible", showBackgroundViewer);
    window.addEventListener("tweet-image-viewer-visible", showTweetImageViewer);
    window.addEventListener("top-panel-visible", renderTopPanel, { once: true });

    return () => {
      window.removeEventListener("background-viewer-visible", showBackgroundViewer);
      window.removeEventListener("tweet-image-viewer-visible", showTweetImageViewer);
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

  function renderTopPanel() {
    clearTimeout(topPanelTimeoutId.current);
    setTopPanel({ rendered: true, forceVisibility: true });
  }

  return (
    <>
      <Background settings={settings.background}/>
      {settings.timeDate.clockDisabled ? null : <Clock settings={settings.timeDate}/>}
      {settings.mainPanel.disabled ? null : <MainPanel settings={settings.mainPanel}/>}
      <BottomPanel/>
      <Tasks/>
      <Suspense fallback={null}>
        {topPanel.rendered && <TopPanel forceVisibility={topPanel.forceVisibility}/>}
        {weather.rendered && <Weather settings={settings.weather} timeFormat={settings.timeDate.format}/>}
        {backgroundViewerVisible && <BackgroundViewer settings={settings.background} hide={hideBackgroundViewer}/>}
        {tweetImageData && <TweetImageViewer data={tweetImageData} hide={hideTweetImageViewer}/>}
      </Suspense>
    </>
  );
}
