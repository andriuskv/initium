import { useState, Suspense, lazy } from "react";
import { dispatchCustomEvent } from "utils";
import { initAppearanceSettings } from "services/settings";
import { resetIDBStore, resetWallpaperInfo } from "services/wallpaper";
import { useSettings } from "contexts/settings";
import Modal from "components/Modal";
import "./general-tab.css";

const MiddleTop = lazy(() => import("./MiddleTop"));

export default function GeneralTab() {
  const { settings, toggleSetting, updateSetting, resetSettings } = useSettings();
  const [modal, setModal] = useState(null);

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

  function hideModal() {
    setModal(null);
  }

  function renderModal() {
    if (modal.type === "reset") {
      return (
        <Modal hide={hideModal}>
          <h4 className="modal-title">Reset settings</h4>
          <p className="modal-text-body">Are you sure you want to reset settings to default?</p>
          <div className="modal-actions">
            <button className="btn text-btn" onClick={hideModal}>Cancel</button>
            <button className="btn" onClick={reset}>Reset</button>
          </div>
        </Modal>
      );
    }
    else if (modal.type === "order") {
      return (
        <Suspense fallback={null}>
          <MiddleTop settings={settings} updateSetting={updateSetting} hide={hideModal}/>
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
      <div className="settings-group">
        <div className="settings-group-top">
          <h4 className="settings-group-title">Greeting</h4>
          <button className="btn outline-btn settings-group-top-btn" onClick={showGreetingEditor}>Editor</button>
        </div>
        <label className="setting">
          <span>Disable greeting</span>
          <input type="checkbox" className="sr-only checkbox-input"
            checked={settings.general.greeting.disabled}
            onChange={toggleGreetingSetting}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
        </label>
        <label className="setting">
          <span>Text size</span>
          <input type="range" className="range-input" min="0.75" max="2.5" step="0.05"
            defaultValue={settings.general.greeting.textSize} onChange={handleRangeInputChange}/>
        </label>
      </div>
      <div className="settings-group last-setting-tab-item">
        <div className="settings-group-top">
          <h4 className="settings-group-title">Middle top</h4>
          <button className="btn outline-btn settings-group-top-btn" onClick={showMiddleTopModal}>Order</button>
        </div>
      </div>
      <div className="setting setting-reset">
        <span>Reset settings</span>
        <button className="btn text-btn text-negative-btn" onClick={showResetModal}>Reset</button>
      </div>
      {modal && renderModal()}
    </div>
  );
}
