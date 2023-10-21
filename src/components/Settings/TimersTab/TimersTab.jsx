import { useSettings } from "contexts/settings";

export default function TimersTab({ locale }) {
  const { settings: { timers: settings }, updateSetting, toggleSetting } = useSettings();

  function handleVolumeChange({ target }) {
    updateSetting("timers", { volume: target.valueAsNumber });
  }

  function handleTextScaleChange({ target }) {
    updateSetting("timers", { fullscreenTextScale: target.valueAsNumber });
  }

  function toggleTimerSetting(event) {
    updateSetting("timers", {
      timer: {
        ...settings.timer,
        usePresetNameAsLabel: event.target.checked
      }
    });
  }

  function handleInputChange({ target }) {
    if (/\D/.test(target.value)) {
      return;
    }
    updateSetting("timers", { pomodoro: { ...settings.pomodoro, [target.name]: Number(target.value) } });
  }

  return (
    <div className="container-body setting-tab">
      <label className="setting">
        <span>{locale.settings.timers.disable_timers_label}</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.disabled}
          onChange={() => toggleSetting("timers", "disabled")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <label className={`setting${settings.disabled ? " disabled" : ""}`}>
        <span>{locale.settings.timers.volume_label}</span>
        <input type="range" className="range-input" min="0" max="1" step="0.05"
          disabled={settings.disabled}
          defaultValue={settings.volume} onChange={handleVolumeChange}/>
      </label>
      <label className={`setting${settings.disabled ? " disabled" : ""}`}>
        <span>{locale.settings.timers.fullscreen_scale_label}</span>
        <input type="range" className="range-input" min="1" max="5" step="0.25"
          disabled={settings.disabled}
          defaultValue={settings.fullscreenTextScale} onChange={handleTextScaleChange}/>
      </label>
      <label className={`setting${settings.disabled ? " disabled" : ""}`}>
        <span>{locale.settings.timers.mini_timer_label}</span>
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
          <h4 className="settings-group-title">{locale.settings.timers.timer_group_title}</h4>
        </div>
        <label className={`setting${settings.disabled ? " disabled" : ""}`}>
          <span>{locale.settings.timers.preset_as_label_label}</span>
          <input type="checkbox" className="sr-only checkbox-input"
            disabled={settings.disabled}
            checked={settings.timer.usePresetNameAsLabel}
            onChange={toggleTimerSetting}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
        </label>
      </div>
      <div className="settings-group">
        <div className="settings-group-top">
          <h4 className="settings-group-title">{locale.settings.timers.pomodoro_group_title}</h4>
        </div>
        <label className={`setting${settings.disabled ? " disabled" : ""}`}>
          <span>{locale.settings.timers.pomodoro_duration_focus}</span>
          <input type="text" className="input setting-input"
            disabled={settings.disabled}
            value={settings.pomodoro.focus}
            onChange={handleInputChange} name="focus"/>
        </label>
        <label className={`setting${settings.disabled ? " disabled" : ""}`}>
          <span>{locale.settings.timers.pomodoro_duration_short_break}</span>
          <input type="text" className="input setting-input"
            disabled={settings.disabled}
            value={settings.pomodoro.short}
            onChange={handleInputChange} name="short"/>
        </label>
        <label className={`setting${settings.disabled ? " disabled" : ""}`}>
          <span>{locale.settings.timers.pomodoro_duration_long_break}</span>
          <input type="text" className="input setting-input"
            disabled={settings.disabled}
            value={settings.pomodoro.long}
            onChange={handleInputChange} name="long"/>
        </label>
      </div>
    </div>
  );
}
