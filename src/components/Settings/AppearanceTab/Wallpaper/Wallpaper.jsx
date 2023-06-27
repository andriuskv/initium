import { useState, useEffect, useRef } from "react";
import { dispatchCustomEvent } from "utils";
import { getWallpaperInfo, resetWallpaperInfo, setUrlWallpaper, setIDBWallpaper } from "services/wallpaper";
import Modal from "components/Modal";
import Icon from "components/Icon";
import "./wallpaper.css";

export default function Wallpaper({ settings, updateContextSetting }) {
  const [wallpaperInfo, setWallpaperInfo] = useState(() => getWallpaperInfo());
  const [wallpaperForm, setWallpaperForm] = useState(null);
  const [wallpaperProvider, setWallpaperProvider] = useState(settings.wallpaper.provider);
  const [wallpaperSettingsDirty, setWallpaperSettingsDirty] = useState(() => {
    const keys = Object.keys(settings.wallpaper);

    if (keys.length > 2 || settings.wallpaper.provider === "bing") {
      return true;
    }
    return false;
  });
  const [messages, setMessages] = useState({});
  const timeoutId = useRef(0);

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
    setWallpaperProvider("");
    updateContextSetting("appearance", { wallpaper: { url: "" } });
    resetWallpaperInfo();
    setWallpaperSettingsDirty(false);
  }

  function showWallpaperViewer() {
    dispatchCustomEvent("wallpaper-viewer-visible");
  }

  function showWallpaperForm() {
    setWallpaperForm({ visible: true });
  }

  function hideWallpaperForm() {
    setWallpaperForm(null);
  }

  function handleWallpaperFormSubmit(event) {
    const [input] = event.target.elements;

    event.preventDefault();

    if (!input.value) {
      setWallpaperForm(null);
      return;
    }
    let url = null;

    try {
      url = new URL(input.value);
    } catch {
      setWallpaperForm({
        ...wallpaperForm,
        message: "Invalid URL."
      });
      return;
    }
    const splitItems = url.pathname.split(".");
    const ext = splitItems.length > 1 ? splitItems.at(-1) : "";

    if (!ext || ["png", "jpg", "jpeg"].includes(ext)) {
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
    updateContextSetting("appearance", { wallpaper: { ...params, type: "url", url, mimeType } });
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
    updateContextSetting("appearance", { wallpaper: { ...params, type: "blob", id: file.name, mimeType: file.type } });
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

    clearTimeout(timeoutId.current);
    timeoutId.current = setTimeout(() => {
      updateContextSetting("appearance", { wallpaper: { ...settings.wallpaper, [name]: Number(value) } });
    }, 1000);
  }

  function handleWallpaperProviderClick(provider) {
    if (provider === settings.wallpaper.provider) {
      return;
    }
    setWallpaperProvider(provider);
    setWallpaperSettingsDirty(provider === "bing");
    resetWallpaperInfo();
    updateContextSetting("appearance", { wallpaper: { url: "", provider } });
  }

  function renderWallpaperForm() {
    return (
      <Modal hide={hideWallpaperForm}>
        <form onSubmit={handleWallpaperFormSubmit}>
          <h4 className="modal-title modal-title-center">Set wallpaper from URL</h4>
          <input type="text" className="input setting-wallpaper-form-input" name="input"placeholder="URL" autoComplete="off"/>
          {wallpaperForm.message ? <div className="setting-wallpaper-form-message">{wallpaperForm.message}</div> : null}
          <div className="modal-actions">
            <button type="button" className="btn text-btn" onClick={hideWallpaperForm}>Cancel</button>
            <button className="btn">Set</button>
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
        <h4 className="settings-group-title">Wallpaper</h4>
        {wallpaperSettingsDirty && <button className="btn outline-btn settings-group-top-btn" onClick={resetWallpaper} title="Reset to default">Reset</button>}
      </div>
      <div className="setting setting-wallpaper">
        <div className="setting-wallpaper-title">Set wallpaper from...</div>
        {settings.wallpaper.mimeType?.startsWith("image") && (settings.wallpaper.url || settings.wallpaper.id) ? (
          <button className="btn icon-btn setting-wallpaper-viewer-btn"
            onClick={showWallpaperViewer}
            title="Adjust wallpaper position">
            <Icon id="image"/>
          </button>
        ) : null}
        <div className="setting-wallpaper-items">
          <div className="setting-wallpaper-item">
            <button className="btn text-btn setting-wallpaper-item-btn" onClick={showWallpaperForm}>URL</button>
          </div>
          <div className="setting-wallpaper-item">
            <button className="btn text-btn setting-wallpaper-item-btn" onClick={selectFile}>Device</button>
          </div>
        </div>
      </div>
      {messages.wallpaper ? (
        <p className="setting-message">{messages.wallpaper}</p>
      ): null}
      {settings.wallpaper.mimeType?.startsWith("video") ? (
        <label className="setting">
          <span>Playback speed</span>
          <input type="range" className="range-input" min="0" max="1" step="0.1"
            defaultValue={settings.wallpaper.videoPlaybackSpeed} onChange={handleVideoPlaybackSpeedChange} name="videoPlaybackSpeed"/>
        </label>
      ) : null}
      <div className="setting setting-wallpaper">
        <div className="setting-wallpaper-title">Daily wallpaper provider</div>
        <div className="setting-wallpaper-items">
          <div className="setting-wallpaper-item">
            <button className={`btn text-btn setting-wallpaper-item-btn${!settings.wallpaper.type && !wallpaperProvider || wallpaperProvider === "unsplash" ? " active" : ""}`}
              onClick={() => handleWallpaperProviderClick("unsplash")}>Unsplash</button>
          </div>
          <div className="setting-wallpaper-item">
            <button className={`btn text-btn setting-wallpaper-item-btn${wallpaperProvider === "bing" ? " active" : ""}`}
              onClick={() => handleWallpaperProviderClick("bing")}>Bing</button>
          </div>
        </div>
      </div>
      {wallpaperInfo && renderWallpaperInfo()}
      {wallpaperForm && renderWallpaperForm()}
    </div>
  );
}
