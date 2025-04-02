import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from "react";
import { dispatchCustomEvent, timeout } from "utils";
import { useModal } from "hooks";
import { getWallpaperInfo, resetWallpaperInfo, setUrlWallpaper, setIDBWallpaper } from "services/wallpaper";
import { useSettings } from "contexts/settings";
import Modal from "components/Modal";
import Icon from "components/Icon";
import "./wallpaper.css";
import type { WallpaperSettings } from "types/settings";

export default function Wallpaper({ locale }: { locale: any }) {
  const { settings: { appearance: settings }, updateContextSetting } = useSettings();
  const [wallpaperInfo, setWallpaperInfo] = useState(() => getWallpaperInfo());
  const { modal, setModal, hiding: modalHiding, hideModal } = useModal();
  const [wallpaperSettingsDirty, setWallpaperSettingsDirty] = useState(() => {
    const keys = Object.keys(settings.wallpaper);

    if (keys.length > 2 || settings.wallpaper.provider === "bing") {
      return true;
    }
    return false;
  });
  const [messages, setMessages] = useState<{ wallpaper?: string}>();
  const timeoutId = useRef(0);
  const wallpaperProvider = settings.wallpaper.provider;

  useEffect(() => {
    window.addEventListener("wallpaper-info-update", handleWallpaperInfoUpdate);

    return () => {
      window.removeEventListener("wallpaper-info-update", handleWallpaperInfoUpdate);
    };
  }, []);

  function handleWallpaperInfoUpdate({ detail }: CustomEventInit) {
    setWallpaperInfo(detail);
  }

  function resetWallpaper() {
    updateContextSetting("appearance", { wallpaper: { url: "", provider: "unsplash" } });
    resetWallpaperInfo();
    setWallpaperSettingsDirty(false);
  }

  function showWallpaperViewer() {
    dispatchCustomEvent("fullscreen-modal", { id: "wallpaper" });
  }

  function showWallpaperForm() {
    setModal({ visible: true });
  }

  function handleWallpaperFormSubmit(event: FormEvent) {
    const formElement = event.target as HTMLFormElement;
    const [element] = formElement.elements;
    const input = element as HTMLInputElement;

    event.preventDefault();

    if (!input.value) {
      setModal(null);
      return;
    }

    if (!URL.canParse(input.value)) {
      setModal({ ...modal, message: "Invalid URL." });
      return;
    }
    const url = new URL(input.value);
    const splitItems = url.pathname.split(".");
    const ext = splitItems.length > 1 ? splitItems.at(-1) : "";

    if (!ext || ["png", "jpg", "jpeg", "webp", "avif"].includes(ext)) {
      const image = new Image();

      image.onload = () => {
        setWallpaper(input.value, `image/${ext}`);
      };

      image.onerror = () => {
        setModal({
          ...modal,
          message: "URL does not contain valid image."
        });
      };
      image.src = input.value;
    }
    else if (["mp4", "webm"].includes(ext)) {
      const video = document.createElement("video");
      const abortController = new AbortController();

      video.crossOrigin = "anonymous";

      video.addEventListener("loadedmetadata", () => {
        setWallpaper(input.value, `video/${ext}`);
        abortController.abort();
      }, { signal: abortController.signal });

      video.addEventListener("error", () => {
        setModal({
          ...modal,
          message: "URL does not contain valid video."
        });
        abortController.abort();
      }, { signal: abortController.signal });

      video.src = input.value;
    }
  }

  function setWallpaper(url: string, mimeType: string) {
    const params: { videoPlaybackSpeed?: number } = {};

    if (mimeType.startsWith("video")) {
      params.videoPlaybackSpeed = settings.wallpaper.videoPlaybackSpeed ?? 1;
    }
    setModal(null);
    updateContextSetting("appearance", { wallpaper: { ...params, type: "url", url, mimeType, provider: "self" } });
    setUrlWallpaper(url, mimeType);
    setWallpaperSettingsDirty(true);
  }

  async function selectFile() {
    const file = await getSelectedFile();

    if (file.size >= 50000000) {
      setMessages({ ...messages, wallpaper: "File size exceeds 50mb. Please try a different file." });
      return;
    }
    setMessages({ ...messages, wallpaper: undefined });

    await setIDBWallpaper(file);

    const params: { videoPlaybackSpeed?: number } = {};

    if (file.type.startsWith("video")) {
      params.videoPlaybackSpeed = settings.wallpaper.videoPlaybackSpeed ?? 1;
    }
    updateContextSetting("appearance", { wallpaper: { ...params, type: "blob", id: file.name, mimeType: file.type, provider: "self" } });
    setWallpaperSettingsDirty(true);
  }

  function getSelectedFile(): Promise<File> {
    return new Promise(resolve => {
      const input = document.createElement("input");

      input.setAttribute("type", "file");
      input.setAttribute("accept", "image/*,video/mp4,video/webm");
      input.onchange = ({ target }) => {
        const input = target as HTMLInputElement;

        if (input.files) {
          resolve(input.files[0]);
        }
        input.onchange = null;
      };
      input.click();
    });
  }

  function handleVideoPlaybackSpeedChange({ target }: ChangeEvent) {
    const { name, value } = target as HTMLInputElement;

    timeoutId.current = timeout(() => {
      updateContextSetting("appearance", { wallpaper: { ...settings.wallpaper, [name]: Number(value) } });
    }, 1000, timeoutId.current);
  }

  function handleWallpaperProviderClick(provider: WallpaperSettings["provider"]) {
    if (provider === settings.wallpaper.provider) {
      return;
    }
    setWallpaperSettingsDirty(provider === "bing");
    resetWallpaperInfo();
    updateContextSetting("appearance", { wallpaper: { url: "", provider } });
  }

  return (
    <div className="settings-group">
      <div className="settings-group-top">
        <h4 className="settings-group-title">{locale.settings.appearance.wallpaper_group_title}</h4>
        {settings.wallpaper.mimeType?.startsWith("image") && (settings.wallpaper.url || settings.wallpaper.id) ? (
          <button className="btn icon-btn setting-wallpaper-viewer-btn"
            onClick={showWallpaperViewer}
            title="Adjust wallpaper position">
            <Icon id="image"/>
          </button>
        ) : null}
        {wallpaperSettingsDirty && <button className="btn outline-btn settings-group-top-btn" onClick={resetWallpaper}>{locale.global.reset}</button>}
      </div>
      <div className="setting">
        <span>{locale.settings.appearance.set_wallpaper_title}</span>
        <div className="setting-wallpaper-items">
          <button className="btn text-btn" onClick={showWallpaperForm}>{locale.global.url_input_label}</button>
          <button className="btn text-btn" onClick={selectFile}>{locale.settings.appearance.set_wallpaper_device_title}</button>
        </div>
      </div>
      {messages?.wallpaper ? (
        <p className="setting-message">{messages.wallpaper}</p>
      ): null}
      {settings.wallpaper.mimeType?.startsWith("video") ? (
        <label className="setting">
          <span>{locale.settings.appearance.wallpaper_playback_speed_label}</span>
          <input type="range" className="range-input" min="0" max="1" step="0.1"
            defaultValue={settings.wallpaper.videoPlaybackSpeed} onChange={handleVideoPlaybackSpeedChange} name="videoPlaybackSpeed"/>
        </label>
      ) : null}
      <div className="setting last-setting-tab-item">
        <span>{locale.settings.appearance.daily_wallpaper_provider_title}</span>
        <div className="setting-wallpaper-providers">
          <button className="btn text-btn setting-wallpaper-provider" disabled={wallpaperProvider === "unsplash"}
            onClick={() => handleWallpaperProviderClick("unsplash")}>
            <span>Unsplash</span>
            {wallpaperProvider === "unsplash" ? <Icon id="check"/> : null}
          </button>
          <button className="btn text-btn setting-wallpaper-provider" disabled={wallpaperProvider === "bing"}
            onClick={() => handleWallpaperProviderClick("bing")}>
            <span>Bing</span>
            {wallpaperProvider === "bing" ? <Icon id="check"/> : null}
          </button>
        </div>
      </div>
      {wallpaperInfo && (
        wallpaperProvider === "bing" ? (
          <p className="setting-wallpaper-info">
            <a href={wallpaperInfo.copyrightLink} target="_blank" rel="noreferrer">{wallpaperInfo.copyright}<Icon id="open-in-new" className="setting-wallpaper-info-inline-icon"/></a>
          </p>
        ) : (
          <p className="setting-wallpaper-info">Wallpaper image by <a href={`https://unsplash.com/@${wallpaperInfo.username}?utm_source=initium&utm_medium=referral`} className="setting-wallpaper-info-link" target="_blank" rel="noreferrer">{wallpaperInfo.name}</a> on <a href="https://unsplash.com/?utm_source=initium&utm_medium=referral" className="setting-wallpaper-info-link" target="_blank" rel="noreferrer">Unsplash</a></p>
        )
      )}
      {modal && (
        <Modal hiding={modalHiding} hide={hideModal}>
          <form onSubmit={handleWallpaperFormSubmit}>
            <h4 className="modal-title modal-title-center">{locale.settings.appearance.wallpaper_url_form_title}</h4>
            <input type="text" className="input setting-wallpaper-form-input" name="input" placeholder={locale.global.url_input_label} autoComplete="off"/>
            {modal.message ? <div className="setting-wallpaper-form-message">{modal.message}</div> : null}
            <div className="modal-actions">
              <button type="button" className="btn text-btn" onClick={hideModal}>{locale.global.cancel}</button>
              <button className="btn">{locale.global.set}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
