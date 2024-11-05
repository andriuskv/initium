import { useRef } from "react";
import { timeout } from "utils";
import Modal from "components/Modal";
import Icon from "components/Icon";
import "./settings.css";

export default function Settings({ settings, user, updateContextSetting, hide }) {
  const timeoutId = useRef(null);
  const userColor = user.highlightColor || user.profileColor;
  const colors = [
    "#1d9bf0",
    "#ffd400",
    "#f91880",
    "#7856ff",
    "#ff7a00",
    "#00ba7c",
    user.profileColor,
    "var(--color-primary)"
  ];

  function handleVideoQualityChange(event) {
    updateContextSetting("videoQuality", event.target.value);
  }

  function handleVideoVolumeChange(event) {
    timeoutId.current = timeout(() => {
      updateContextSetting("videoVolume", event.target.valueAsNumber);
    }, 1000, timeoutId.current);
  }

  function selectColor(color) {
    updateContextSetting("highlightColor", color);
  }

  return (
    <Modal className="twitter-settings" hide={hide}>
      <div className="twitter-settings-header">
        <h3 className="twitter-settings-title">Settings</h3>
        <button className="btn icon-btn" onClick={hide} title="Close">
          <Icon id="cross"/>
        </button>
      </div>
      <label className="twitter-settings-section twitter-settings-section-row">
        <span className="twitter-settings-section-title">Video quality</span>
        <div className="select-container">
          <select className="input select" onChange={handleVideoQualityChange} value={settings.videoQuality}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </label>
      <label className="twitter-settings-section twitter-settings-section-row">
        <span className="twitter-settings-section-title">Video volume</span>
        <input type="range" className="range-input" min="0" max="1" step="0.05"
          onChange={handleVideoVolumeChange} defaultValue={settings.videoVolume}/>
      </label>
      <div className="twitter-settings-section">
        <h4 className="twitter-settings-section-title">Highlight color</h4>
        <ul className="twitter-settings-colors">
          {colors.map((color, index) => (
            <li key={index}>
              <button className="btn icon-btn twitter-settings-color-btn"
                onClick={() => selectColor(color)} style={{ backgroundColor: color }}>
                {userColor === color ? <Icon id="check"/> : null}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
