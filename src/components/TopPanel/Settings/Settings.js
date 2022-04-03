import { useState, useRef } from "react";
import { getSetting, updateSetting } from "services/settings";
import "./settings.css";

export default function Settings({ setFullscreenTextScale }) {
  const [settings, setSettings] = useState(() => getSetting("topPanel"));
  const timeoutId = useRef(null);

  function setSetting(key, value) {
    settings[key] = value;

    setSettings({ ...settings });
    clearTimeout(timeoutId.current);
    timeoutId.current = setTimeout(() => {
      updateSetting({ topPanel: { [key]: value } });
    }, 1000);
  }

  function handleAlarmVolumeChange({ target }) {
    setSetting("alarmVolume", target.valueAsNumber);
  }

  function handleTextScaleChange({ target }) {
    const { valueAsNumber } = target;

    setFullscreenTextScale(valueAsNumber);
    setSetting("fullscreenTextScale", valueAsNumber);
  }

  return (
    <div className="top-panel-item-content top-panel-settings-tab">
      <label className="top-panel-setting">
        <span className="label-left">Alarm volume</span>
        <input type="range" className="range-input" min="0" max="1" step="0.05"
          defaultValue={settings.alarmVolume} onChange={handleAlarmVolumeChange}/>
      </label>

      <label className="top-panel-setting">
        <span className="label-left">Fullscreen text scale</span>
        <input type="range" className="range-input" min="1" max="5" step="0.5"
          defaultValue={settings.fullscreenTextScale} onChange={handleTextScaleChange}/>
      </label>
    </div>
  );
}
