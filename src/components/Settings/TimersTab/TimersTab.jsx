import { useSettings } from "contexts/settings";

export default function TimersTab() {
  const { settings: { timers: settings }, updateSetting, toggleSetting } = useSettings();

  function handleAlarmVolumeChange({ target }) {
    updateSetting("timers", { alarmVolume: target.valueAsNumber });
  }

  function handleTextScaleChange({ target }) {
    updateSetting("timers", { fullscreenTextScale: target.valueAsNumber });
  }

  function handleInputChange({ target }) {
    if (/\D/.test(target.value)) {
      return;
    }
    updateSetting("timers", { pomodoro: { ...settings.pomodoro, [target.name]: Number(target.value) } });
  }

  return (
    <div className="setting-tab">
      <label className="setting">
        <span>Disable timers</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.disabled}
          onChange={() => toggleSetting("timers", "disabled")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <label className={`setting${settings.disabled ? " disabled" : ""}`}>
        <span>Alarm volume</span>
        <input type="range" className="range-input" min="0" max="1" step="0.05"
          disabled={settings.disabled}
          defaultValue={settings.alarmVolume} onChange={handleAlarmVolumeChange}/>
      </label>
      <label className={`setting${settings.disabled ? " disabled" : ""}`}>
        <span>Fullscreen text scale</span>
        <input type="range" className="range-input" min="1" max="5" step="0.5"
          disabled={settings.disabled}
          defaultValue={settings.fullscreenTextScale} onChange={handleTextScaleChange}/>
      </label>
      <label className={`setting${settings.disabled ? " disabled" : ""}`}>
        <span>Show minimal timer when top panel is hidden</span>
        <input type="checkbox" className="sr-only checkbox-input"
          disabled={settings.disabled}
          checked={settings.showMinimal}
          onChange={() => toggleSetting("timers", "showMinimal")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <div className="settings-group">
        <div className="settings-group-top">
          <h4 className="settings-group-title">Pomodoro</h4>
        </div>
      </div>
      <label className={`setting${settings.disabled ? " disabled" : ""}`}>
        <span>Focus duration</span>
        <input type="text" className="input setting-input"
          disabled={settings.disabled}
          value={settings.pomodoro.focus}
          onChange={handleInputChange} name="focus"/>
      </label>
      <label className={`setting${settings.disabled ? " disabled" : ""}`}>
        <span>Short break duration</span>
        <input type="text" className="input setting-input"
          disabled={settings.disabled}
          value={settings.pomodoro.short}
          onChange={handleInputChange} name="short"/>
      </label>
      <label className={`setting${settings.disabled ? " disabled" : ""}`}>
        <span>Long break duration</span>
        <input type="text" className="input setting-input"
          disabled={settings.disabled}
          value={settings.pomodoro.long}
          onChange={handleInputChange} name="long"/>
      </label>
    </div>
  );
}