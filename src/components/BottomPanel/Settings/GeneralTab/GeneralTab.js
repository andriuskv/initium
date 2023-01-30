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
      <label className="setting">
        <span>Disable Google apps</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.general.googleAppsDisabled}
          onChange={() => toggleSetting("general", "googleAppsDisabled")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <label className="setting">
        <span>Disable timers</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.general.timersDisabled}
          onChange={() => toggleSetting("general", "timersDisabled")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <label className="setting">
        <span>Disable calendar</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.general.calendarDisabled}
          onChange={() => toggleSetting("general", "calendarDisabled")}/>
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
