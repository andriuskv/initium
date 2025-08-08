import { useState, useEffect, useRef, lazy, Suspense, type FC } from "react";
import type { AppearanceSettings } from "types/settings";
import { getRandomString, timeout } from "utils";
import { useLocalization } from "contexts/localization";
import FullscreenModal from "components/FullscreenModal";
import Spinner from "components/Spinner";
import { getItemPos } from "services/widget-pos";

const Settings = lazy(() => import("components/Settings"));
const WallpaperViewer = lazy(() => import("components/WallpaperViewer"));
const GreetingEditor = lazy(() => import("components/GreetingEditor"));

type FullscreenModalType = {
  id?: string,
  hiding?: boolean,
  component?: FC<{ locale: any, hide: () => void }>,
  params?: { [key: string]: unknown }
}

export default function FullscreenItems({ appearanceSettings }: { appearanceSettings: AppearanceSettings }) {
  const locale = useLocalization();
  const [fullscreenModal, setFullscreenModal] = useState<FullscreenModalType>({});
  const modalTimeoutId = useRef(0);

  useEffect(() => {
    window.addEventListener("fullscreen-modal", handleFullscreenModal);

    return () => {
      window.removeEventListener("fullscreen-modal", handleFullscreenModal);
    };
  }, [fullscreenModal]);

  function handleFullscreenModal({ detail }: CustomEventInit) {
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
          }, 200 * appearanceSettings.animationSpeed, modalTimeoutId.current);
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
    }, 200 * appearanceSettings.animationSpeed, modalTimeoutId.current);
  }

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
    const item = getItemPos("settings");
    const attrs = {
      "data-move-target": "settings",
      "style": item ? { "--x": item.x, "--y": item.y } : {},
      // With compiler enabled element with changed attrs doesn't get rerendered, to circumvent that pass in random attr
      [`data-${getRandomString()}`]: "",
    };

    return (
      <FullscreenModal hiding={fullscreenModal.hiding} hide={hideFullscreenModal} {...attrs}>
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
        <fullscreenModal.component {...fullscreenModal.params} locale={locale} hide={hideFullscreenModal}/>
      </FullscreenModal>
    );
  }
  return null;
}
