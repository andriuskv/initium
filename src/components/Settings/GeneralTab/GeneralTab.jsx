import { dispatchCustomEvent } from "utils";
import { initAppearanceSettings } from "services/settings";
import { resetIDBStore, resetWallpaperInfo } from "services/wallpaper";
import { useSettings } from "contexts/settings";
import "./general-tab.css";
import MiddleTop from "./MiddleTop";

export default function GeneralTab() {
  const { settings, toggleSetting, updateSetting, resetSettings } = useSettings();

  function showGreetingEditor() {
    dispatchCustomEvent("fullscreen-modal", { id: "greeting" });
  }

  function toggleGreetingSetting(event) {
    updateSetting("general", {
      greeting: {
        ...settings.general.greeting,
        disabled: event.target.checked
      }
    });
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

    const newSettings = resetSettings();

    initAppearanceSettings(newSettings.appearance);
  }

  return (
    <div className="setting-tab">
      <div className="setting setting-greeting">
        <div className="setting-greeting-item">
          <button className="btn" onClick={showGreetingEditor} disabled={settings.general.greeting.disabled}>Set the greeting</button>
        </div>
        <label className="setting-greeting-item">
          <input type="checkbox" className="sr-only checkbox-input"
            checked={settings.general.greeting.disabled}
            onChange={toggleGreetingSetting}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
          <span className="checkbox-label-right">Disable greeting</span>
        </label>
      </div>
      <label className="setting">
        <span>Disable sticky notes</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.general.stickyNotesDisabled}
          onChange={() => toggleSetting("general", "stickyNotesDisabled")}/>
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
        <span>Disable calendar</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.general.calendarDisabled}
          onChange={() => toggleSetting("general", "calendarDisabled")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <MiddleTop settings={settings} updateSetting={updateSetting}/>
      <div className="setting setting-reset">
        <span>Reset settings</span>
        <button className="btn" onClick={reset}>Reset</button>
      </div>
    </div>
  );
}
