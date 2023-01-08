import { dispatchCustomEvent } from "utils";
import { initAppearanceSettings } from "services/settings";
import { useSettings } from "contexts/settings-context";
import { resetIDBStore } from "services/wallpaper";
import "./general-tab.css";

export default function GeneralTab() {
  const { settings, toggleSetting, resetSettings } = useSettings();

  function showGreetingEditor() {
    dispatchCustomEvent("greeting-editor-visible");
  }

  function reset() {
    if (settings.appearance.wallpaper.type === "blob") {
      localStorage.removeItem("downscaled-wallpaper");
      resetIDBStore();
    }
    localStorage.removeItem("noise");
    document.body.style.setProperty("--panel-background-noise", "");

    const newSettings = resetSettings();

    initAppearanceSettings(newSettings.appearance);
  }

  return (
    <div className="setting-tab">
      <label className="setting">
        <span>Center clock when main panel is hidden</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.general.centerClock}
          onChange={() => toggleSetting("general", "centerClock")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <div className="setting setting-greeting">
        <div className="setting-greeting-item">
          <button className="btn" onClick={showGreetingEditor} disabled={settings.general.greetingDisabled}>Set the greeting</button>
        </div>
        <label className="setting-greeting-item">
          <input type="checkbox" className="sr-only checkbox-input"
            checked={settings.general.greetingDisabled}
            onChange={() => toggleSetting("general", "greetingDisabled")}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
          <span className="checkbox-label-right">Disable greeting</span>
        </label>
      </div>
      <label className="setting">
        <span>Disable tasks</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.general.tasksDisabled}
          onChange={() => toggleSetting("general", "tasksDisabled")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <div className="setting setting-reset">
        <span>Reset settings</span>
        <button className="btn" onClick={reset}>Reset</button>
      </div>
    </div>
  );
}
