import { useState, useEffect } from "react";
import { dispatchCustomEvent } from "utils";
import { useSettings } from "contexts/settings-context";
import { getBackgroundInfo, setUrlBackground, setIDBBackground } from "services/background";
import Icon from "components/Icon";
import "./background-tab.css";

export default function BackgroundTab() {
  const { settings: { background: settings }, setSetting } = useSettings();
  const [backgroundInfo, setBackgroundInfo] = useState(() => getBackgroundInfo());
  const [form, setForm] = useState(null);

  useEffect(() => {
    window.addEventListener("background-info-update", handleBackgroundInfoUpdate);

    return () => {
      window.removeEventListener("background-info-update", handleBackgroundInfoUpdate);
    };
  }, []);

  function handleBackgroundInfoUpdate({ detail }) {
    setBackgroundInfo(detail);
  }

  function resetBackground() {
    setSetting("background", { url: "" });
  }

  function showBackgroundViewer() {
    dispatchCustomEvent("background-viewer-visible");
  }

  function showBackgroundForm() {
    setForm({ visible: true });
  }

  function handleBackgroundFormSubmit(event) {
    const [input] = event.target.elements;
    const image = new Image();

    event.preventDefault();

    if (!input.value) {
      setForm(null);
      return;
    }

    image.onload = () => {
      setBackground(input.value);
    };

    image.onerror = () => {
      setForm({
        ...form,
        invalid: true
      });
    };
    image.src = input.value;
  }

  function setBackground(url) {
    setForm(null);
    setSetting("background", { type: "url", url });
    setUrlBackground(url);
  }

  async function selectFile() {
    const image = await getImageFile();

    await setIDBBackground(image);
    setSetting("background", { type: "blob", id: image.name });
  }

  function getImageFile() {
    return new Promise(resolve => {
      const input = document.createElement("input");

      input.setAttribute("type", "file");
      input.setAttribute("accept", "image/*");
      input.onchange = ({ target }) => {
        resolve(target.files[0]);
        target = "";
        input.onchange = null;
      };
      input.click();
    });
  }

  if (form?.visible) {
    return (
      <div className="setting-tab setting-tab-form-container">
        <form onSubmit={handleBackgroundFormSubmit}>
          <h3 className="setting-tab-form-title">Set background from URL</h3>
          <div className="setting-tab-form-input-container">
            <input type="text" className="input" placeholder="URL" name="input"/>
            <button className="btn setting-tab-form-submit-btn">Set</button>
          </div>
          {form.invalid && <div className="setting-tab-form-message">URL does not contain valid image.</div>}
        </form>
      </div>
    );
  }
  return (
    <div className="setting-tab">
      <div className="setting">
        <span>Reset background</span>
        <button className="btn" onClick={resetBackground}>Reset</button>
      </div>
      <div className="setting setting-background">
        <div className="setting-background-title">Set background from...</div>
        {settings.url || settings.id ? (
          <button className="btn icon-btn setting-background-viewer-btn"
            onClick={showBackgroundViewer}
            title="Adjust background position">
            <Icon id="image"/>
          </button>
        ) : null}
        <div className="setting-background-items">
          <div className="setting-background-item">
            <button className="btn text-btn setting-background-item-btn" onClick={showBackgroundForm}>URL</button>
          </div>
          <div className="setting-background-item">
            <button className="btn text-btn setting-background-item-btn" onClick={selectFile}>Device</button>
          </div>
        </div>
      </div>
      {backgroundInfo && (
        <p className="setting-background-info">Background image by <a href={`https://unsplash.com/@${backgroundInfo.username}?utm_source=initium&utm_medium=referral`} className="setting-background-info-link">{backgroundInfo.name}</a> on <a href="https://unsplash.com/?utm_source=initium&utm_medium=referral" className="setting-background-info-link">Unsplash</a></p>
      )}
    </div>
  );
}
