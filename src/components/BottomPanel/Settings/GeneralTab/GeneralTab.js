import { dispatchCustomEvent } from "utils";
import { useSettings } from "contexts/settings-context";
import "./general-tab.css";

export default function GeneralTab() {
  const { settings: { general: settings }, toggleSetting } = useSettings();

  function showGreetingEditor() {
    dispatchCustomEvent("greeting-editor-visible");
  }

  return (
    <div className="setting-tab">
      <label className="setting">
        <span>Center clock when main panel is hidden</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.centerClock}
          onChange={() => toggleSetting("general", "centerClock")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <div className="setting setting-greeting">
        <div className="setting-greeting-item">
          <button className="btn" onClick={showGreetingEditor} disabled={settings.greetingDisabled}>Set a greeting</button>
        </div>
        <label className="setting-greeting-item">
          <input type="checkbox" className="sr-only checkbox-input"
            checked={settings.greetingDisabled}
            onChange={() => toggleSetting("general", "greetingDisabled")}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
          <span className="checkbox-label-right">Disable greeting</span>
        </label>
      </div>
      {/* <div className="setting">
        <span>Reset Settings</span>
        <button className="btn">Reset</button>
      </div> */}
    </div>
  );
}
