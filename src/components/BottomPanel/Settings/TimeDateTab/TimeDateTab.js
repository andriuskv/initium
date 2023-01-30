import { useRef } from "react";
import { useSettings } from "contexts/settings-context";

export default function TimeDateTab() {
  const { settings: { timeDate: settings }, updateSetting, toggleSetting } = useSettings();
  const timeoutId = useRef(0);

  function toggleTimeFormat() {
    const { format } = settings;

    updateSetting("timeDate", { format: format === 24 ? 12 : 24 });
  }

  function updateRangeSetting(name, value) {
    clearTimeout(timeoutId.current);
    timeoutId.current = setTimeout(() => {
      updateSetting("timeDate", { [name]: Number(value) });
    }, 1000);
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

  function handleDateOffsetChange({ target }) {
    const { name, value } = target;

    document.querySelector(".clock").style.setProperty("--date-offset", value);
    updateRangeSetting(name, value);
  }

  function handleDatePositionChange({ target }) {
    updateSetting("timeDate", { datePosition: target.value });
  }

  function handleDateAligmentChange({ target }) {
    updateSetting("timeDate", { dateAligment: target.value });
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
    <div className="setting-tab">
      <label className="setting">
        <span>Time display format</span>
        <input type="checkbox" className="sr-only toggle-input"
          checked={settings.format === 24}
          onChange={toggleTimeFormat}/>
        <div className="toggle">
          <div className="toggle-item">12</div>
          <div className="toggle-item">24</div>
        </div>
      </label>
      <div className="settings-group">
        <h4 className="settings-group-title">Clock</h4>
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
          <span>Clock style</span>
          <div className="select-container">
            <select className="input select" onChange={handleClockStyleChange} value={settings.clockStyle}
              disabled={settings.clockDisabled}>
              <option value="Inter">Inter</option>
              <option value="JuliusSansOne">JuliusSansOne</option>
              <option value="OleoScript">OleoScript</option>
              <option value="Stoke">Stoke</option>
              <option value="KdamThmorPro">KdamThmorPro</option>
              <option value="Caveat">Caveat</option>
              <option value="Digital">Digital</option>
              <option value="Foundation">Foundation</option>
              <option value="PressStart2P">PressStart2P</option>
              <option value="Sniglet">Sniglet</option>
            </select>
          </div>
        </label>
        <label className={`setting${settings.clockDisabled ? " disabled" : ""}`}>
          <span>Clock scale</span>
          <input type="range" className="range-input" min="0.5" max="3" step="0.1"
            defaultValue={settings.clockScale} name="clockScale"
            onChange={handleClockScaleChange} disabled={settings.clockDisabled}/>
        </label>
        <label className={`setting${settings.clockDisabled ? " disabled" : ""}`}>
          <span>Bolded clock</span>
          <input type="checkbox" className="sr-only checkbox-input"
            checked={settings.boldedClock}
            onChange={() => toggleSetting("timeDate", "boldedClock")}
            disabled={settings.clockDisabled}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
        </label>
        <label className={`setting${settings.clockDisabled ? " disabled" : ""}`}>
          <span>Center clock when main panel is hidden</span>
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
        <h4 className="settings-group-title">Date</h4>
        <label className={`setting${settings.clockDisabled ? " disabled" : ""}`}>
          <span>Hide date</span>
          <input type="checkbox" className="sr-only checkbox-input"
            checked={settings.dateHidden}
            onChange={() => toggleSetting("timeDate", "dateHidden")}
            disabled={settings.clockDisabled}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
        </label>
        <label className={`setting${settings.clockDisabled || settings.dateHidden ? " disabled" : ""}`}>
          <span>Date Language</span>
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
          <span>Don't change date style</span>
          <input type="checkbox" className="sr-only checkbox-input"
            checked={settings.dontChangeDateStyle}
            onChange={() => toggleSetting("timeDate", "dontChangeDateStyle")}
            disabled={settings.clockDisabled || settings.dateHidden}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
        </label>
        <label className={`setting${settings.clockDisabled || settings.dateHidden ? " disabled" : ""}`}>
          <span>Date offset</span>
          <input type="range" className="range-input" min="4" max="48" step="2"
            defaultValue={settings.dateOffset} name="dateOffset"
            onChange={handleDateOffsetChange} disabled={settings.clockDisabled || settings.dateHidden}/>
        </label>
        <label className={`setting${settings.clockDisabled || settings.dateHidden ? " disabled" : ""}`}>
          <span>Date position</span>
          <div className="select-container">
            <select className="input select" onChange={handleDatePositionChange} value={settings.datePosition}
              disabled={settings.clockDisabled || settings.dateHidden}>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>
        </label>
        <label className={`setting${settings.clockDisabled || settings.dateHidden ? " disabled" : ""}`}>
          <span>Date aligment</span>
          <div className="select-container">
            <select className="input select" onChange={handleDateAligmentChange} value={settings.dateAligment}
              disabled={settings.clockDisabled || settings.dateHidden}>
              <option value="start">Start</option>
              <option value="center">Center</option>
              <option value="end">End</option>
            </select>
          </div>
        </label>
        <label className={`setting${settings.clockDisabled || settings.dateHidden ? " disabled" : ""}`}>
          <span>Bolded date</span>
          <input type="checkbox" className="sr-only checkbox-input"
            checked={settings.boldedDate}
            onChange={() => toggleSetting("timeDate", "boldedDate")}
            disabled={settings.clockDisabled || settings.dateHidden}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
        </label>
        <label className={`setting${settings.clockDisabled || settings.dateHidden ? " disabled" : ""}`}>
          <span>Date scale</span>
          <input type="range" className="range-input" min="0.8" max="2" step="0.1"
            defaultValue={settings.dateScale} name="dateScale"
            onChange={handleDateScaleChange} disabled={settings.clockDisabled || settings.dateHidden}/>
        </label>
      </div>
      <div className="settings-group">
        <h4 className="settings-group-title">Calendar</h4>
        <label className="setting">
          <span>First day of the week</span>
          <div className="select-container">
            <select className="input select" onChange={handleWeekdayChange} value={settings.firstWeekday}
              disabled={settings.clockDisabled}>
              <option value="0">Monday</option>
              <option value="1">Sunday</option>
            </select>
          </div>
        </label>
      </div>
    </div>
  );
}
