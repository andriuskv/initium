import { useState, useEffect, useRef } from "react";
import { dispatchCustomEvent, timeout } from "utils";
import { useModal } from "hooks";
import { getWallpaperInfo, resetWallpaperInfo, setUrlWallpaper, setIDBWallpaper } from "services/wallpaper";
import Modal from "components/Modal";
import Icon from "components/Icon";
import "./wallpaper.css";

export default function Wallpaper({ settings, locale, updateContextSetting }) {
  const [wallpaperInfo, setWallpaperInfo] = useState(() => getWallpaperInfo());
  const [wallpaperForm, setWallpaperForm, hideWallpaperForm] = useModal(null);
  const [wallpaperSettingsDirty, setWallpaperSettingsDirty] = useState(() => {
    const keys = Object.keys(settings.wallpaper);

    if (keys.length > 2 || settings.wallpaper.provider === "bing") {
      return true;
    }
    return false;
  });
  const [messages, setMessages] = useState({});
  const timeoutId = useRef(0);
  const wallpaperProvider = settings.wallpaper.provider;

  useEffect(() => {
    window.addEventListener("wallpaper-info-update", handleWallpaperInfoUpdate);

    return () => {
      window.removeEventListener("wallpaper-info-update", handleWallpaperInfoUpdate);
    };
  }, []);

  function handleWallpaperInfoUpdate({ detail }) {
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
    setWallpaperForm({ visible: true });
  }

  function handleWallpaperFormSubmit(event) {
    const [input] = event.target.elements;

    event.preventDefault();

    if (!input.value) {
      setWallpaperForm(null);
      return;
    }

    if (!URL.canParse(input.value)) {
      setWallpaperForm({ ...wallpaperForm, message: "Invalid URL." });
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
        setWallpaperForm({
          ...wallpaperForm,
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
        setWallpaperForm({
          ...wallpaperForm,
          message: "URL does not contain valid video."
        });
        abortController.abort();
      }, { signal: abortController.signal });

      video.src = input.value;
    }
  }

  function setWallpaper(url, mimeType) {
    const params = {};

    if (mimeType.startsWith("video")) {
      params.videoPlaybackSpeed = settings.wallpaper.videoPlaybackSpeed ?? 1;
    }
    setWallpaperForm(null);
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
    delete messages.wallpaper;
    setMessages({ ...messages });

    await setIDBWallpaper(file);

    const params = {};

    if (file.type.startsWith("video")) {
      params.videoPlaybackSpeed = settings.wallpaper.videoPlaybackSpeed ?? 1;
    }
    updateContextSetting("appearance", { wallpaper: { ...params, type: "blob", id: file.name, mimeType: file.type, provider: "self" } });
    setWallpaperSettingsDirty(true);
  }

  function getSelectedFile() {
    return new Promise(resolve => {
      const input = document.createElement("input");

      input.setAttribute("type", "file");
      input.setAttribute("accept", "image/*,video/mp4,video/webm");
      input.onchange = ({ target }) => {
        resolve(target.files[0]);
        target = "";
        input.onchange = null;
      };
      input.click();
    });
  }

  function handleVideoPlaybackSpeedChange({ target }) {
    const { name, value } = target;

    timeoutId.current = timeout(() => {
      updateContextSetting("appearance", { wallpaper: { ...settings.wallpaper, [name]: Number(value) } });
    }, 1000, timeoutId.current);
  }

  function handleWallpaperProviderClick(provider) {
    if (provider === settings.wallpaper.provider) {
      return;
    }
    setWallpaperSettingsDirty(provider === "bing");
    resetWallpaperInfo();
    updateContextSetting("appearance", { wallpaper: { url: "", provider } });
  }

  function renderWallpaperForm() {
    return (
      <Modal hiding={wallpaperForm.hiding} hide={hideWallpaperForm}>
        <form onSubmit={handleWallpaperFormSubmit}>
          <h4 className="modal-title modal-title-center">{locale.settings.appearance.wallpaper_url_form_title}</h4>
          <input type="text" className="input setting-wallpaper-form-input" name="input" placeholder={locale.global.url_input_label} autoComplete="off"/>
          {wallpaperForm.message ? <div className="setting-wallpaper-form-message">{wallpaperForm.message}</div> : null}
          <div className="modal-actions">
            <button type="button" className="btn text-btn" onClick={hideWallpaperForm}>{locale.global.cancel}</button>
            <button className="btn">{locale.global.set}</button>
          </div>
        </form>
      </Modal>
    );
  }

  function renderWallpaperInfo() {
    if (wallpaperProvider === "bing") {
      return (
        <p className="setting-wallpaper-info">
          <a href={wallpaperInfo.copyrightLink} target="_blank" rel="noreferrer">{wallpaperInfo.copyright}<Icon id="open-in-new" className="setting-wallpaper-info-inline-icon"/></a>
        </p>
      );
    }
    return (
      <p className="setting-wallpaper-info">Wallpaper image by <a href={`https://unsplash.com/@${wallpaperInfo.username}?utm_source=initium&utm_medium=referral`} className="setting-wallpaper-info-link" target="_blank" rel="noreferrer">{wallpaperInfo.name}</a> on <a href="https://unsplash.com/?utm_source=initium&utm_medium=referral" className="setting-wallpaper-info-link" target="_blank" rel="noreferrer">Unsplash</a></p>
    );
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
      {messages.wallpaper ? (
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
      {wallpaperInfo && renderWallpaperInfo()}
      {wallpaperForm && renderWallpaperForm()}
    </div>
  );
}
