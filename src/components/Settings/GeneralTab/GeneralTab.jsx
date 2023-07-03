import { dispatchCustomEvent } from "utils";
import { initAppearanceSettings } from "services/settings";
import { useSettings } from "contexts/settings";
import { resetIDBStore, resetWallpaperInfo } from "services/wallpaper";
import "./general-tab.css";

export default function GeneralTab() {
  const { settings, toggleSetting, resetSettings } = useSettings();

  function showGreetingEditor() {
    dispatchCustomEvent("fullscreen-modal", { id: "greeting" });
  }

  function reset() {
    if (settings.appearance.wallpaper.type === "blob") {
      localStorage.removeItem("downscaled-wallpaper");
      resetIDBStore();
    }
    else if (settings.appearance.wallpaper.provider === "bing") {
      resetWallpaperInfo();
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
        <span>Disable shortcuts</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.general.shortcutsDisabled}
          onChange={() => toggleSetting("general", "shortcutsDisabled")}/>
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
