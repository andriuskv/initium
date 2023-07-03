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
const GreetingEditor = lazy(() => import("./GreetingEditor"));
const FullscreenModal = lazy(() => import("./FullscreenModal"));

export default function App() {
  const { settings } = useSettings();
  const [weather, setWeather] = useState(() => ({ rendered: false, shouldDelay: isWeatherEnabled() }));
  const [fullscreenModal, setFullscreenModal] = useState(null);
  const weatherTimeoutId = useRef(0);

  useLayoutEffect(() => {
    initAppearanceSettings(settings.appearance);
  }, []);

  useEffect(() => {
    window.addEventListener("fullscreen-modal", showFullscreenModal);

    return () => {
      window.removeEventListener("fullscreen-modal", showFullscreenModal);
    };
  }, [fullscreenModal]);

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

  function showFullscreenModal({ detail }) {
    if (detail.shouldToggle && detail.id === fullscreenModal?.id) {
      hideFullscreenModal();
    }
    else {
      setFullscreenModal(detail);
    }
  }

  function hideFullscreenModal() {
    setFullscreenModal(null);
  }

  function renderFullscreenModal() {
    if (fullscreenModal.id === "greeting") {
      return (
        <Suspense fallback={null}>
          <GreetingEditor hide={hideFullscreenModal}/>
        </Suspense>
      );
    }
    else if (fullscreenModal.id === "settings") {
      return (
        <Suspense fallback={null}>
          {<Settings hide={hideFullscreenModal}/>}
        </Suspense>
      );
    }
    else if (fullscreenModal.id === "wallpaper") {
      return (
        <Suspense fallback={null}>
          <WallpaperViewer hide={hideFullscreenModal}/>
        </Suspense>
      );
    }
    return (
      <Suspense fallback={null}>
        <FullscreenModal hide={hideFullscreenModal}>
          <fullscreenModal.component {...fullscreenModal.params} hide={hideFullscreenModal}/>
        </FullscreenModal>
      </Suspense>
    );
  }

  return (
    <>
      <Wallpaper settings={settings.appearance.wallpaper}/>
      <MiddleTop settings={settings} greetingEditorVisible={fullscreenModal?.id === "greeting"}/>
      <Suspense fallback={null}>
        {settings.mainPanel.disabled ? null : <MainPanel settings={settings.mainPanel}/>}
      </Suspense>
      <Suspense fallback={null}>
        {weather.rendered && <Weather timeFormat={settings.timeDate.format}/>}
      </Suspense>
      <BottomPanel/>
      <Suspense fallback={null}>
        {settings.tasks.disabled ? null : <Tasks settings={settings.tasks}/>}
      </Suspense>
      {fullscreenModal ? renderFullscreenModal() : null}
    </>
  );
}
