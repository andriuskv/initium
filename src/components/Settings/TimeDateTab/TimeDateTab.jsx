import { useRef } from "react";
import { timeout } from "utils";
import { useSettings } from "contexts/settings";

export default function TimeDateTab({ locale }) {
  const { settings: { timeDate: settings }, updateSetting, toggleSetting } = useSettings();
  const timeoutId = useRef(0);

  function toggleTimeFormat() {
    const { format } = settings;

    updateSetting("timeDate", { format: format === 24 ? 12 : 24 });
  }

  function updateRangeSetting(name, value) {
    timeoutId.current = timeout(() => {
      updateSetting("timeDate", { [name]: Number(value) });
    }, 1000, timeoutId.current);
  }

  function handleClockScaleChange({ target }) {
    const { name, value } = target;

    document.querySelector(".clock").style.setProperty("--scale", value);
    updateRangeSetting(name, value);
  }

  function handleDateScaleChange({ target }) {
    const { name, value } = target;

    document.querySelector(".clock-date").style.setProperty("--date-scale", value);
    updateRangeSetting(name, value);
  }

  function handleDatePositionChange({ target }) {
    updateSetting("timeDate", { datePosition: target.value });
  }

  function handleDateAlignmentChange({ target }) {
    updateSetting("timeDate", { dateAlignment: target.value });
  }

  function handleClockStyleChange({ target }) {
    updateSetting("timeDate", { clockStyle: target.value });
  }

  function handleDateLocaleChange({ target }) {
    updateSetting("timeDate", { dateLocale: target.value });
  }

  function handleWeekdayChange({ target }) {
    updateSetting("timeDate", { firstWeekday: Number(target.value) });
  }

  return (
    <div className="container-body setting-tab">
      <label className="setting">
        <span>{locale.settings.time_date.time_format_label}</span>
        <input type="checkbox" className="sr-only toggle-input"
          checked={settings.format === 24}
          onChange={toggleTimeFormat}/>
        <div className="toggle">
          <div className="toggle-item">12</div>
          <div className="toggle-item">24</div>
        </div>
      </label>
      <div className="settings-group">
        <div className="settings-group-top">
          <h4 className="settings-group-title">{locale.settings.time_date.clock_group_title}</h4>
        </div>
        <label className="setting">
          <span>{locale.settings.time_date.disable_clock_label}</span>
          <input type="checkbox" className="sr-only checkbox-input"
            checked={settings.clockDisabled}
            onChange={() => toggleSetting("timeDate", "clockDisabled")}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
        </label>
        <label className={`setting${settings.clockDisabled ? " disabled" : ""}`}>
          <span>{locale.settings.time_date.clock_style_label}</span>
          <div className="select-container">
            <select className="input select" onChange={handleClockStyleChange} value={settings.clockStyle}
              disabled={settings.clockDisabled}>
              <option value="default">{locale.settings.time_date.clock_style_default}</option>
              <option value="vertical">{locale.settings.time_date.clock_style_vertical}</option>
            </select>
          </div>
        </label>
        <label className={`setting${settings.clockDisabled ? " disabled" : ""}`}>
          <span>{locale.settings.time_date.clock_scale_label}</span>
          <input type="range" className="range-input" min="0.5" max="3" step="0.1"
            defaultValue={settings.clockScale} name="clockScale"
            onChange={handleClockScaleChange} disabled={settings.clockDisabled}/>
        </label>
        <label className={`setting${settings.clockDisabled ? " disabled" : ""}`}>
          <span>{locale.settings.time_date.center_clock_label}</span>
          <input type="checkbox" className="sr-only checkbox-input"
            checked={settings.centerClock}
            onChange={() => toggleSetting("timeDate", "centerClock")}
            disabled={settings.clockDisabled}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
        </label>
      </div>
      <div className="settings-group">
        <div className="settings-group-top">
          <h4 className="settings-group-title">{locale.settings.time_date.date_group_title}</h4>
        </div>
        <label className={`setting${settings.clockDisabled ? " disabled" : ""}`}>
          <span>{locale.settings.time_date.hide_date_label}</span>
          <input type="checkbox" className="sr-only checkbox-input"
            checked={settings.dateHidden}
            onChange={() => toggleSetting("timeDate", "dateHidden")}
            disabled={settings.clockDisabled}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
        </label>
        <label className={`setting${settings.clockDisabled || settings.dateHidden ? " disabled" : ""}`}>
          <span>{locale.settings.time_date.date_lang_label}</span>
          <div className="select-container">
            <select className="input select" onChange={handleDateLocaleChange} value={settings.dateLocale}
              disabled={settings.clockDisabled || settings.dateHidden}>
              <option value="system">System</option>
              <option value="cs-CZ">Čeština</option>
              <option value="da-DK">Dansk</option>
              <option value="en-US">English</option>
              <option value="de-DE">Deutsch</option>
              <option value="et-ET">Eesti</option>
              <option value="es-ES">Español</option>
              <option value="fr-FR">Français</option>
              <option value="hr-HR">Hrvatski</option>
              <option value="it-IT">Italiano</option>
              <option value="lv-LV">Latviešu</option>
              <option value="lt-LT">Lietuvių</option>
              <option value="hu-HU">Magyar</option>
              <option value="nl-NL">Nederlands</option>
              <option value="no-NO">Norsk</option>
              <option value="pl-PL">Polski</option>
              <option value="pt-PT">Português</option>
              <option value="ro-RO">Română</option>
              <option value="sk-SK">Slovenčina</option>
              <option value="sl-SI">Slovenščina</option>
              <option value="sr-Latn">Srpski</option>
              <option value="fi-FI">Suomi</option>
              <option value="sv-SE">Svenska</option>
              <option value="tr-TR">Türkçe</option>
              <option value="bg-BG">български</option>
              <option value="ru-RU">Русский</option>
              <option value="uk-UK">Українська</option>
              <option value="el-GR">Ελληνικά</option>
              <option value="he-IL">עברית</option>
              <option value="hi-IN">हिंदी</option>
              <option value="zh-CN">中文</option>
              <option value="ja-JP">日本語</option>
              <option value="ko-KR">한국어</option>
              {/* <option value="bs-BA">Bosanski</option> */}
              {/* <option value="sq-AL">Shqip</option> */}
              {/* <option value="mk-MK">Македонски</option> */}
              {/* <option value="is-IS">Íslenska</option> */}
              {/* <option value="zh-CN">中文 (简体)</option> */}
              {/* <option value="zh-HK">中文 (香港)</option> */}
              {/* <option value="zh-TW">中文 (繁體)</option> */}
            </select>
          </div>
        </label>
        <label className={`setting${settings.clockDisabled || settings.dateHidden ? " disabled" : ""}`}>
          <span>{locale.settings.time_date.date_postion_label}</span>
          <div className="select-container">
            <select className="input select" onChange={handleDatePositionChange} value={settings.datePosition}
              disabled={settings.clockDisabled || settings.dateHidden}>
              <option value="top">{locale.settings.time_date.date_postion_top}</option>
              <option value="bottom">{locale.settings.time_date.date_postion_bottom}</option>
            </select>
          </div>
        </label>
        <label className={`setting${settings.clockDisabled || settings.dateHidden ? " disabled" : ""}`}>
          <span>{locale.settings.time_date.date_align_label}</span>
          <div className="select-container">
            <select className="input select" onChange={handleDateAlignmentChange} value={settings.dateAlignment}
              disabled={settings.clockDisabled || settings.dateHidden}>
              <option value="start">{locale.settings.time_date.date_align_start}</option>
              <option value="center">{locale.settings.time_date.date_align_center}</option>
              <option value="end">{locale.settings.time_date.date_align_end}</option>
            </select>
          </div>
        </label>
        <label className={`setting${settings.clockDisabled || settings.dateHidden ? " disabled" : ""}`}>
          <span>{locale.settings.time_date.date_scale_label}</span>
          <input type="range" className="range-input" min="0.8" max="2" step="0.1"
            defaultValue={settings.dateScale} name="dateScale"
            onChange={handleDateScaleChange} disabled={settings.clockDisabled || settings.dateHidden}/>
        </label>
      </div>
      <div className="settings-group">
        <div className="settings-group-top">
          <h4 className="settings-group-title">{locale.settings.time_date.calendar_group_title}</h4>
        </div>
        <label className="setting">
          <span>{locale.settings.time_date.first_weekday_label}</span>
          <div className="select-container">
            <select className="input select" onChange={handleWeekdayChange} value={settings.firstWeekday}
              disabled={settings.clockDisabled}>
              <option value="0">Monday</option>
              <option value="1">Sunday</option>
            </select>
          </div>
        </label>
        <label className="setting">
          <span>{locale.settings.time_date.hide_clocks_label}</span>
          <input type="checkbox" className="sr-only checkbox-input"
            checked={settings.worldClocksHidden}
            onChange={() => toggleSetting("timeDate", "worldClocksHidden")}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
        </label>
        <label className="setting last-setting-tab-item">
          <span>Hide current day reminder preview</span>
          <input type="checkbox" className="sr-only checkbox-input"
            checked={settings.reminderPreviewHidden}
            onChange={() => toggleSetting("timeDate", "reminderPreviewHidden")}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
        </label>
      </div>
    </div>
  );
}
