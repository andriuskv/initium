import { Suspense, lazy } from "react";
import { dispatchCustomEvent } from "utils";
import { useModal } from "hooks";
import { initAppearanceSettings } from "services/settings";
import { resetIDBStore, resetWallpaperInfo } from "services/wallpaper";
import { useSettings } from "contexts/settings";
import Modal from "components/Modal";
import "./general-tab.css";

const MiddleTop = lazy(() => import("./MiddleTop"));

export default function GeneralTab({ locale }) {
  const { settings, toggleSetting, updateSetting, resetSettings } = useSettings();
  const [modal, setModal, hideModal] = useModal(null);

  // function handleLocaleChange({ target }) {
  //   updateSetting("general", { locale: target.value });
  // }

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

  function handleRangeInputChange({ target }) {
    updateSetting("general", {
      greeting: {
        ...settings.general.greeting,
        textSize: Number(target.value)
      }
    });
  }

  function showMiddleTopModal() {
    setModal({ type: "order" });
  }

  function showResetModal() {
    setModal({ type: "reset" });
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
    hideModal();
  }

  function renderModal() {
    if (modal.type === "reset") {
      return (
        <Modal hiding={modal.hiding} hide={hideModal}>
          <h4 className="modal-title">{locale.settings.general.reset_settings_title}</h4>
          <p className="modal-text-body">{locale.settings.general.reset_settings_message}</p>
          <div className="modal-actions">
            <button className="btn text-btn" onClick={hideModal}>{locale.global.cancel}</button>
            <button className="btn" onClick={reset}>{locale.global.reset}</button>
          </div>
        </Modal>
      );
    }
    else if (modal.type === "order") {
      return (
        <Suspense fallback={null}>
          <MiddleTop settings={settings} locale={locale} updateSetting={updateSetting} hiding={modal.hiding} hide={hideModal}/>
        </Suspense>
      );
    }
    return null;
  }

  return (
    <div className="container-body setting-tab">
      {/* <label className="setting">
        <span>Language</span>
        <div className="select-container">
          <select className="input select" onChange={handleLocaleChange} value={settings.general.locale}>
            <option value="en">English</option>
          </select>
        </div>
      </label> */}
      <label className="setting">
        <span>{locale.settings.general.disable_sticky_notes_label}</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.general.stickyNotesDisabled}
          onChange={() => toggleSetting("general", "stickyNotesDisabled")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <label className="setting">
        <span>{locale.settings.general.disable_shortcuts_label}</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.general.shortcutsDisabled}
          onChange={() => toggleSetting("general", "shortcutsDisabled")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <label className="setting">
        <span>{locale.settings.general.disable_calendar_label}</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.general.calendarDisabled}
          onChange={() => toggleSetting("general", "calendarDisabled")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <div className="settings-group">
        <div className="settings-group-top">
          <h4 className="settings-group-title">{locale.settings.general.greeting_group_title}</h4>
          <button className="btn outline-btn settings-group-top-btn" onClick={showGreetingEditor}>{locale.settings.general.show_greeting_editor_title}</button>
        </div>
        <label className="setting">
          <span>{locale.settings.general.disable_greeting_label}</span>
          <input type="checkbox" className="sr-only checkbox-input"
            checked={settings.general.greeting.disabled}
            onChange={toggleGreetingSetting}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
        </label>
        <label className="setting">
          <span>{locale.global.text_size_title}</span>
          <input type="range" className="range-input" min="0.75" max="2.5" step="0.05"
            defaultValue={settings.general.greeting.textSize} onChange={handleRangeInputChange}/>
        </label>
      </div>
      <div className="settings-group last-setting-tab-item">
        <div className="settings-group-top">
          <h4 className="settings-group-title">{locale.settings.general.middle_top_group_title}</h4>
          <button className="btn outline-btn settings-group-top-btn" onClick={showMiddleTopModal}>{locale.settings.general.show_middle_top_title}</button>
        </div>
      </div>
      <label className="setting">
        <span>Open links in a new tab</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.general.openLinkInNewTab}
          onChange={() => toggleSetting("general", "openLinkInNewTab")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <div className="setting setting-reset">
        <span>{locale.settings.general.reset_settings_title}</span>
        <button className="btn text-btn text-negative-btn" onClick={showResetModal}>{locale.global.reset}</button>
      </div>
      {modal && renderModal()}
    </div>
  );
}
