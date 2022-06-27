import { useRef } from "react";
import { useSettings } from "contexts/settings-context";

export default function TimeDateTab() {
  const { settings: { timeDate: settings }, updateSetting, toggleSetting } = useSettings();
  const timeoutId = useRef(0);

  function toggleTimeFormat() {
    const { format } = settings;

    updateSetting("timeDate", { format: format === 24 ? 12 : 24 });
  }

  function handleRangeInputChange({ target }) {
    const { name, value } = target;

    document.querySelector(".clock").style.setProperty("--scale", value);

    clearTimeout(timeoutId.current);
    timeoutId.current = setTimeout(() => {
      updateSetting("timeDate", { [name]: Number(value) });
    }, 1000);
  }

  function handleDateAligmentChange({ target }) {
    updateSetting("timeDate", { dateAligment: target.value });
  }

  function handleClockStyleChange({ target }) {
    updateSetting("timeDate", { clockStyle: target.value });
  }

  return (
    <div className="setting-tab">
      <label className="setting">
        <span>Time display format</span>
        <input type="checkbox" className="sr-only toggle-input"
          checked={settings.format === 24}
          onChange={toggleTimeFormat}/>
        <div className="toggle">
          <div className="toggle-item">12</div>
          <div className="toggle-item">24</div>
        </div>
      </label>
      <label className="setting">
        <span>Disable clock</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.clockDisabled}
          onChange={() => toggleSetting("timeDate", "clockDisabled")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <label className={`setting${settings.clockDisabled ? " disabled" : ""}`}>
        <span>Clock scale</span>
        <input type="range" className="range-input" min="0.5" max="3" step="0.1"
          defaultValue={settings.clockScale} name="clockScale"
          onChange={handleRangeInputChange} disabled={settings.clockDisabled}/>
      </label>
      <label className={`setting${settings.clockDisabled ? " disabled" : ""}`}>
        <span>Clock style</span>
        <div className="select-container">
          <select className="input select" onChange={handleClockStyleChange} value={settings.clockStyle}
            disabled={settings.clockDisabled}>
            <option value="Inter">Inter</option>
            <option value="JuliusSansOne">JuliusSansOne</option>
            <option value="OleoScript">OleoScript</option>
            <option value="Stoke">Stoke</option>
            <option value="KdamThmorPro">KdamThmorPro</option>
            <option value="JotiOne">JotiOne</option>
            <option value="RockSalt">RockSalt</option>
          </select>
        </div>
      </label>
      <label className={`setting${settings.clockDisabled ? " disabled" : ""}`}>
        <span>Hide date</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.dateHidden}
          onChange={() => toggleSetting("timeDate", "dateHidden")}
          disabled={settings.clockDisabled}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <label className={`setting${settings.clockDisabled || settings.dateHidden ? " disabled" : ""}`}>
        <span>Display date above clock</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.dateAboveClock}
          onChange={() => toggleSetting("timeDate", "dateAboveClock")}
          disabled={settings.clockDisabled || settings.dateHidden}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <label className={`setting${settings.clockDisabled || settings.dateHidden ? " disabled" : ""}`}>
        <span>Date aligment</span>
        <div className="select-container">
          <select className="input select" onChange={handleDateAligmentChange} value={settings.dateAligment}
            disabled={settings.clockDisabled || settings.dateHidden}>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </label>
      <label className={`setting${settings.clockDisabled || settings.dateHidden ? " disabled" : ""}`}>
        <span>Don't change date's style</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.dontChangeDateStyle}
          onChange={() => toggleSetting("timeDate", "dontChangeDateStyle")}
          disabled={settings.clockDisabled || settings.dateHidden}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
    </div>
  );
}
