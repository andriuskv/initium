import type { FC } from "react";
import type { Announcement } from "types/announcement";
import { useState, useEffect, useLayoutEffect, useRef, lazy, Suspense } from "react";
import { timeout } from "utils";
import { initAppearanceSettings } from "services/settings";
import { useSettings } from "contexts/settings";
import { useLocalization } from "contexts/localization";
import { useNotification } from "contexts/notification";
import Wallpaper from "components/Wallpaper";
import MiddleTop from "components/MiddleTop";
import BottomPanel from "components/BottomPanel";
import FullscreenModal from "components/FullscreenModal";
import Tooltip from "components/Tooltip";
import Notification from "components/Notification";
import Spinner from "components/Spinner";

const MainPanel = lazy(() => import("./MainPanel"));
const Weather = lazy(() => import("./Weather"));
const Tasks = lazy(() => import("./Tasks"));
const Settings = lazy(() => import("./Settings"));
const WallpaperViewer = lazy(() => import("./WallpaperViewer"));
const GreetingEditor = lazy(() => import("./GreetingEditor"));
const StickyNotes = lazy(() => import("./StickyNotes"));

type FullscreenModalType = {
  id?: string,
  hiding?: boolean,
  component?: FC<{ hide: () => void }>,
  params?: { [key: string]: unknown }
}

export default function App() {
  const { settings } = useSettings();
  const locale = useLocalization();
  const { showNotification } = useNotification();
  const [weather, setWeather] = useState<{ rendered: boolean, shouldDelay?: boolean}>(() => ({ rendered: false, shouldDelay: isWeatherEnabled() }));
  const [fullscreenModal, setFullscreenModal] = useState<FullscreenModalType>({});
  const weatherTimeoutId = useRef(0);
  const modalTimeoutId = useRef(0);

  useLayoutEffect(() => {
    initAppearanceSettings(settings.appearance);
    initAnnouncements();
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

  async function initAnnouncements() {
    try {
      const json = await fetch(`${process.env.SERVER_URL}/messages`).then(res => res.json());

      if (json.messages) {
        const currentDate = Date.now();
        const localAnnouncements: Announcement[] = (JSON.parse(localStorage.getItem("announcements")) || [])
          .filter(a => a.expires > currentDate);
        const newMessages = (json.messages as Announcement[])
          .filter(m => !localAnnouncements.some((l => l.id === m.id)));

        for (const message of newMessages) {
          showNotification(message);
          localAnnouncements.push({
            ...message,
            date: Date.now(),
          });
        }
        localStorage.setItem("announcements", JSON.stringify(localAnnouncements));
      }
    } catch (err) {
      console.log(err);
    }
  }

  function isWeatherEnabled() {
    return !settings.weather.disabled && (!!settings.weather.cityName || settings.weather.useGeo);
  }

  function handleFullscreenModal({ detail }: CustomEvent) {
    if (detail.shouldToggle && detail.id === fullscreenModal.id) {
      if (fullscreenModal.hiding) {
        clearTimeout(modalTimeoutId.current);
        setFullscreenModal(detail);
      }
      else {
        hideFullscreenModal();
      }
    }
    else {
      if (fullscreenModal.id) {
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
      setFullscreenModal({});
      return;
    }
    setFullscreenModal({ ...fullscreenModal, hiding: true });

    modalTimeoutId.current = timeout(() => {
      setFullscreenModal({});
    }, 200 * settings.appearance.animationSpeed, modalTimeoutId.current);
  }

  function renderFullscreenModal() {
    if (fullscreenModal.id === "greeting") {
      return (
        <FullscreenModal hiding={fullscreenModal.hiding} hide={hideFullscreenModal}>
          <Suspense fallback={<div className="greeting-editor"><Spinner size="24px"/></div>}>
            {<GreetingEditor locale={locale} hide={hideFullscreenModal}/>}
          </Suspense>
        </FullscreenModal>
      );
    }
    else if (fullscreenModal.id === "settings") {
      return (
        <FullscreenModal hiding={fullscreenModal.hiding} hide={hideFullscreenModal}>
          <Suspense fallback={<div className="settings"><Spinner size="24px"/></div>}>
            {<Settings locale={locale} hide={hideFullscreenModal}/>}
          </Suspense>
        </FullscreenModal>
      );
    }
    else if (fullscreenModal.id === "wallpaper") {
      return (
        <FullscreenModal transparent mask noAnim hide={hideFullscreenModal}>
          <Suspense fallback={null}>
            <WallpaperViewer locale={locale} hide={hideFullscreenModal}/>
          </Suspense>
        </FullscreenModal>
      );
    }
    else if (fullscreenModal.component) {
      return (
        <FullscreenModal hiding={fullscreenModal.hiding} hide={hideFullscreenModal}>
          <fullscreenModal.component {...fullscreenModal.params} hide={hideFullscreenModal}/>
        </FullscreenModal>
      );
    }
    return null;
  }

  if (!locale) {
    return null;
  }
  return (
    <>
      <Wallpaper settings={settings.appearance.wallpaper}/>
      <MiddleTop settings={settings} greetingEditorVisible={fullscreenModal.id === "greeting"}/>
      <Suspense fallback={null}>
        {settings.general.stickyNotesDisabled ? null : <StickyNotes locale={locale}/>}
      </Suspense>
      <Suspense fallback={null}>
        {settings.mainPanel.disabled ? null : <MainPanel settings={settings.mainPanel} locale={locale}/>}
      </Suspense>
      <Suspense fallback={null}>
        {settings.tasks.disabled ? null : <Tasks settings={settings.tasks} generalSettings={settings.general} locale={locale}/>}
      </Suspense>
      <Suspense fallback={null}>
        {weather.rendered && <Weather timeFormat={settings.timeDate.format} locale={locale}/>}
      </Suspense>
      <BottomPanel locale={locale}/>
      <Tooltip/>
      <Notification/>
      {fullscreenModal.id || fullscreenModal.params ? renderFullscreenModal() : null}
    </>
  );
}
