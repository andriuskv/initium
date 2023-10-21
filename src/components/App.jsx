import { useState, useEffect, useLayoutEffect, useRef, lazy, Suspense } from "react";
import { timeout } from "utils";
import { initAppearanceSettings } from "services/settings";
import { useSettings } from "contexts/settings";
import { useLocalization } from "contexts/localization";
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
const StickyNotes = lazy(() => import("./StickyNotes"));

export default function App() {
  const { settings } = useSettings();
  const locale = useLocalization();
  const [weather, setWeather] = useState(() => ({ rendered: false, shouldDelay: isWeatherEnabled() }));
  const [fullscreenModal, setFullscreenModal] = useState(null);
  const weatherTimeoutId = useRef(0);
  const modalTimeoutId = useRef(0);

  useLayoutEffect(() => {
    initAppearanceSettings(settings.appearance);
  }, []);

  useEffect(() => {
    window.addEventListener("fullscreen-modal", handleFullscreenModal);

    return () => {
      window.removeEventListener("fullscreen-modal", handleFullscreenModal);
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

  function handleFullscreenModal({ detail }) {
    if (detail.shouldToggle && detail.id === fullscreenModal?.id) {
      if (fullscreenModal.hiding) {
        clearTimeout(modalTimeoutId.current);
        setFullscreenModal(detail);
      }
      else {
        hideFullscreenModal();
      }
    }
    else {
      if (fullscreenModal) {
        if (detail.id === fullscreenModal.id) {
          setFullscreenModal(detail);
        }
        else {
          hideFullscreenModal();

          modalTimeoutId.current = timeout(() => {
            setFullscreenModal(detail);
          }, 200 * settings.appearance.animationSpeed, modalTimeoutId.current);

        }
      }
      else {
        setFullscreenModal(detail);
      }
    }
  }

  function hideFullscreenModal() {
    if (fullscreenModal.id === "wallpaper") {
      setFullscreenModal(null);
      return;
    }
    setFullscreenModal({ ...fullscreenModal, hiding: true });

    modalTimeoutId.current = timeout(() => {
      setFullscreenModal(null);
    }, 200 * settings.appearance.animationSpeed, modalTimeoutId.current);
  }

  function renderFullscreenModal() {
    if (fullscreenModal.id === "greeting") {
      return (
        <Suspense fallback={null}>
          <GreetingEditor hiding={fullscreenModal.hiding} locale={locale} hide={hideFullscreenModal}/>
        </Suspense>
      );
    }
    else if (fullscreenModal.id === "settings") {
      return (
        <Suspense fallback={null}>
          {<Settings hiding={fullscreenModal.hiding} locale={locale} hide={hideFullscreenModal}/>}
        </Suspense>
      );
    }
    else if (fullscreenModal.id === "wallpaper") {
      return (
        <Suspense fallback={null}>
          <WallpaperViewer locale={locale} hide={hideFullscreenModal}/>
        </Suspense>
      );
    }
    return (
      <Suspense fallback={null}>
        <FullscreenModal hiding={fullscreenModal.hiding} hide={hideFullscreenModal}>
          <fullscreenModal.component {...fullscreenModal.params} hide={hideFullscreenModal}/>
        </FullscreenModal>
      </Suspense>
    );
  }

  if (!locale) {
    return null;
  }
  return (
    <>
      <Wallpaper settings={settings.appearance.wallpaper}/>
      <MiddleTop settings={settings} greetingEditorVisible={fullscreenModal?.id === "greeting"}/>
      <Suspense fallback={null}>
        {settings.general.stickyNotesDisabled ? null : <StickyNotes locale={locale}/>}
      </Suspense>
      <Suspense fallback={null}>
        {settings.mainPanel.disabled ? null : <MainPanel settings={settings.mainPanel} locale={locale}/>}
      </Suspense>
      <Suspense fallback={null}>
        {settings.tasks.disabled ? null : <Tasks settings={settings.tasks} locale={locale}/>}
      </Suspense>
      <Suspense fallback={null}>
        {weather.rendered && <Weather timeFormat={settings.timeDate.format} locale={locale}/>}
      </Suspense>
      <BottomPanel locale={locale}/>
      {fullscreenModal ? renderFullscreenModal() : null}
    </>
  );
}
