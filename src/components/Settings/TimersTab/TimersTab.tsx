import { useSettings } from "contexts/settings";
import type { ChangeEvent } from "react";

export default function TimersTab({ locale }: { locale: any }) {
  const { settings: { timers: settings }, updateContextSetting, toggleSetting } = useSettings();

  function handleVolumeChange({ target }: ChangeEvent) {
    updateContextSetting("timers", { volume: (target as HTMLInputElement).valueAsNumber });
  }

  function handleTextScaleChange({ target }: ChangeEvent) {
    updateContextSetting("timers", { fullscreenTextScale: (target as HTMLInputElement).valueAsNumber });
  }

  function toggleTimerSetting(event: ChangeEvent) {
    updateContextSetting("timers", {
      timer: {
        ...settings.timer,
        usePresetNameAsLabel: (event.target as HTMLInputElement).checked
      }
    });
  }

  function handleInputChange({ target }: ChangeEvent) {
    const inputElement = target as HTMLInputElement;

    if (/\D/.test(inputElement.value)) {
      return;
    }
    updateContextSetting("timers", {
      pomodoro: {
        ...settings.pomodoro,
        [inputElement.name]: Number(inputElement.value)
      }
    });
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
