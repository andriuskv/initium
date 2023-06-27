import { useState, useEffect, useLayoutEffect, useRef, lazy, Suspense } from "react";
import { initAppearanceSettings } from "services/settings";
import { useSettings } from "contexts/settings";
import Wallpaper from "components/Wallpaper";
import MiddleTop from "components/MiddleTop";
import BottomPanel from "components/BottomPanel";

const MainPanel = lazy(() => import("./MainPanel"));
const Weather = lazy(() => import("./Weather"));
const Tasks = lazy(() => import("./Tasks"));
const Settings = lazy(() => import("./Settings"));
const WallpaperViewer = lazy(() => import("./WallpaperViewer"));
const TweetImageViewer = lazy(() => import("./TweetImageViewer"));
const GreetingEditor = lazy(() => import("./GreetingEditor"));
const FullscreenModal = lazy(() => import("./FullscreenModal"));

export default function App() {
  const { settings } = useSettings();
  const [wallpaperViewerVisible, setWallpaperViewerVisible] = useState(false);
  const [tweetImageData, setTweetImageData] = useState(null);
  const [greetingEditorVisible, setGreetingEditorVisible] = useState(false);
  const [fullscreenModal, setFullscreenModal] = useState(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [weather, setWeather] = useState(() => ({ rendered: false, shouldDelay: isWeatherEnabled() }));
  const weatherTimeoutId = useRef(0);

  useLayoutEffect(() => {
    initAppearanceSettings(settings.appearance);
  }, []);

  useEffect(() => {
    window.addEventListener("wallpaper-viewer-visible", showWallpaperViewer);
    window.addEventListener("tweet-image-viewer-visible", showTweetImageViewer);
    window.addEventListener("greeting-editor-visible", showGreetingEditor);
    window.addEventListener("fullscreen-modal-visible", showFullscreenModal);

    return () => {
      window.removeEventListener("wallpaper-viewer-visible", showWallpaperViewer);
      window.removeEventListener("tweet-image-viewer-visible", showTweetImageViewer);
      window.removeEventListener("greeting-editor-visible", showGreetingEditor);
      window.removeEventListener("fullscreen-modal-visible", showFullscreenModal);
    };
  }, []);

  useEffect(() => {
    window.addEventListener("toggle-settings", toggleSettings);

    return () => {
      window.removeEventListener("toggle-settings", toggleSettings);
    };
  }, [settingsVisible]);

  useEffect(() => {
    const shouldRender = isWeatherEnabled();

    clearTimeout(weatherTimeoutId.current);

    if (shouldRender) {
      if (weather.shouldDelay) {
        weatherTimeoutId.current = setTimeout(() => {
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
    return !settings.weather.disabled && (settings.weather.cityName || settings.weather.useGeo);
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
    setGreetingEditorVisible(true);
  }

  function hideGreetingEditor() {
    setGreetingEditorVisible(false);
  }

  function showFullscreenModal({ detail }) {
    setFullscreenModal(detail);
  }

  function hideFullscreenModal() {
    setFullscreenModal(null);
  }

  function toggleSettings() {
    setSettingsVisible(!settingsVisible);
  }

  function hideSettings() {
    setSettingsVisible(false);
  }

  return (
    <>
      <Wallpaper settings={settings.appearance.wallpaper}/>
      <MiddleTop settings={settings} greetingEditorVisible={greetingEditorVisible}/>
      <Suspense fallback={null}>
        {settings.mainPanel.disabled ? null : <MainPanel settings={settings.mainPanel}/>}
      </Suspense>
      <Suspense fallback={null}>
        {weather.rendered && <Weather timeFormat={settings.timeDate.format}/>}
      </Suspense>
      <BottomPanel/>
      <Suspense fallback={null}>
        {settings.general.tasksDisabled ? null : <Tasks/>}
      </Suspense>
      <Suspense fallback={null}>
        {wallpaperViewerVisible && <WallpaperViewer settings={settings.appearance.wallpaper} hide={hideWallpaperViewer}/>}
        {tweetImageData && <TweetImageViewer data={tweetImageData} hide={hideTweetImageViewer}/>}
      </Suspense>
      <Suspense fallback={null}>
        {greetingEditorVisible ? <GreetingEditor hide={hideGreetingEditor}/> : null}
      </Suspense>
      <Suspense fallback={null}>
        {fullscreenModal ? (
          <FullscreenModal content={fullscreenModal} hide={hideFullscreenModal}>
            <fullscreenModal.component {...fullscreenModal.params} hide={hideFullscreenModal}/>
          </FullscreenModal>
        ) : null}
      </Suspense>
      <Suspense fallback={null}>
        {settingsVisible ? <Settings hide={hideSettings}/> : null}
      </Suspense>
    </>
  );
}
