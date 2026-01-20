import { useLayoutEffect, lazy, Suspense, useRef } from "react";
import { initAppearanceSettings } from "services/settings";
import { fetchLocale, getReadableLocale } from "services/localization";
import { fetchAnnouncements } from "services/notifications";
import { useSettings } from "contexts/settings";
import { useLocalization } from "contexts/localization";
import { useNotification } from "contexts/notification";
import Wallpaper from "components/Wallpaper";
import MiddleTop from "components/MiddleTop";
import Placement from "components/Placement";
import Tooltip from "components/Tooltip";
import Notifications from "components/Notifications";
import FullscreenItems from "components/FullscreenItems";

const MainPanel = lazy(() => import("./MainPanel"));
const StickyNotes = lazy(() => import("./StickyNotes"));

export default function App() {
  const { settings, updateContextSetting } = useSettings();
  const locale = useLocalization();
  const { showNotification } = useNotification();
  const firstRender = useRef(true);

  useLayoutEffect(() => {
    initAppearanceSettings(settings.appearance);
  }, []);

  useLayoutEffect(() => {
    if (!locale) {
      return;
    }
    const first = localStorage.getItem("first");

    async function initAnnouncements() {
      try {
        const newNotifications = await fetchAnnouncements();

        if (newNotifications.length > 0) {
          for (const notification of newNotifications) {
            showNotification(notification);
          }
        }
      } catch (err) {
        console.log(err);
      }
    }

    if (firstRender.current) {
      firstRender.current = false;
      initAnnouncements();
    }

    const date = Date.now().toString();

    if (first) {
      if (first === "1") {
        localStorage.setItem("first", date);
      }
      return;
    }
    localStorage.setItem("first", date);

    async function initLang() {
      try {
        /* global chrome */
        const full = chrome.i18n.getUILanguage();
        const part = full.split("-")[0];
        const readable = getReadableLocale(part);

        if (part !== "en" && part !== locale.locale && readable) {
          const uiLocale = await fetchLocale(part);

          showNotification({
            id: "lang-switch",
            content: `${uiLocale.global.lang_switch}\nDo you want to switch to ${readable}?`,
            action: () => {
              updateContextSetting("general", { locale: part });
            },
            actionTitle: `${uiLocale.global.switch} / Switch`,
            dismissTitle: `${uiLocale.global.dismiss} / Dismiss`,
          });
        }
      } catch (err) {
        console.log(err);
      }
    }

    initLang();
  }, [locale]);

  if (!locale) {
    return null;
  }
  return (
    <>
      <Wallpaper settings={settings.appearance.wallpaper} />
      <Suspense fallback={null}>
        {settings.general.stickyNotesDisabled ? null : <StickyNotes />}
      </Suspense>
      <Suspense fallback={null}>
        {settings.mainPanel.disabled ? null : <MainPanel settings={settings.mainPanel} />}
      </Suspense>
      <MiddleTop settings={settings} />
      <Placement />
      <Tooltip />
      <Notifications />
      <FullscreenItems appearanceSettings={settings.appearance} />
    </>
  );
}
