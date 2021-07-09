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

  return (
    <div className="setting-tab">
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
        <span>Hide date</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.dateHidden}
          onChange={() => toggleSetting("timeDate", "dateHidden")}
          disabled={settings.clockDisabled}/>
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
      <label className="setting">
        <span>Time display format</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.format === 24}
          onChange={toggleTimeFormat}/>
        <div className="toggle">
          <div>12</div>
          <div>24</div>
        </div>
      </label>
    </div>
  );
}
