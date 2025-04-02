import type { Announcement } from "types/announcement";
import { useLayoutEffect, lazy, Suspense } from "react";
import { initAppearanceSettings } from "services/settings";
import { useSettings } from "contexts/settings";
import { useLocalization } from "contexts/localization";
import { useNotification } from "contexts/notification";
import Wallpaper from "components/Wallpaper";
import MiddleTop from "components/MiddleTop";
import Placement from "components/Placement";
import Tooltip from "components/Tooltip";
import Notification from "components/Notification";
import FullscreenItems from "components/FullscreenItems";
import { getLocalStorageItem } from "utils";

const MainPanel = lazy(() => import("./MainPanel"));
const StickyNotes = lazy(() => import("./StickyNotes"));

export default function App() {
  const { settings } = useSettings();
  const locale = useLocalization();
  const { showNotification } = useNotification();

  useLayoutEffect(() => {
    initAppearanceSettings(settings.appearance);
    initAnnouncements();
  }, []);

  async function initAnnouncements() {
    try {
      const json = await fetch(`${process.env.SERVER_URL}/messages`).then(res => res.json());

      if (json.messages) {
        const currentDate = Date.now();
        const localAnnouncements = (getLocalStorageItem<Announcement[]>("announcements") || [])
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

  if (!locale) {
    return null;
  }

  return (
    <>
      <Wallpaper settings={settings.appearance.wallpaper}/>
      <MiddleTop settings={settings}/>
      <Suspense fallback={null}>
        {settings.general.stickyNotesDisabled ? null : <StickyNotes locale={locale}/>}
      </Suspense>
      <Suspense fallback={null}>
        {settings.mainPanel.disabled ? null : <MainPanel settings={settings.mainPanel} locale={locale}/>}
      </Suspense>
      <Placement locale={locale}/>
      <Tooltip/>
      <Notification/>
      <FullscreenItems locale={locale} appearanceSettings={settings.appearance}/>
    </>
  );
}
