import { useSettings } from "contexts/settings-context";

export default function TimeDateTab() {
  const { settings: { timeDate: settings }, updateSetting, toggleSetting } = useSettings();

  function toggleTimeFormat() {
    const { format } = settings;

    updateSetting("timeDate", { format: format === 24 ? 12 : 24 });
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
        <span>Hide clock date</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.dateHidden}
          onChange={() => toggleSetting("timeDate", "dateHidden")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
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
