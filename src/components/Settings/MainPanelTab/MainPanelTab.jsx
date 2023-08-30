import { useState } from "react";
import { useSettings } from "contexts/settings";
import { dispatchCustomEvent } from "utils";

export default function MainPanelTab() {
  const { settings: { mainPanel: settings }, updateSetting, updateMainPanelComponentSetting, toggleSetting } = useSettings();
  const [persistentSitesEditEnabled, setPersistentSiteEditEnabled] = useState(false);
  const [topSitesDirty, setTopSitesDirty] = useState(() => !!localStorage.getItem("top sites"));

  function toggleComponent(item) {
    const componentsArray = Object.keys(settings.components);
    let disabledComponentCount = 0;
    settings.components[item].disabled = !settings.components[item].disabled;

    for (const key of componentsArray) {
      if (settings.components[key].disabled) {
        disabledComponentCount += 1;
      }
    }
    updateSetting("mainPanel", {
      navDisabled: disabledComponentCount >= componentsArray.length - 1,
      disabled: disabledComponentCount === componentsArray.length,
      components: { ...settings.components }
    });
  }

  function resetTopSites() {
    setTopSitesDirty(false);
    dispatchCustomEvent("reset-top-sites");
  }

  function toggleTopSiteItemCount({ target }) {
    toggleTopSiteSetting({ visibleItemCount: target.checked ? 4 : 8 });
  }

  function toggleTopSiteOpenSetting({ target }) {
    toggleTopSiteSetting({ openInNewTab: target.checked });
  }

  function toggleTopSiteButtonVisibility({ target }) {
    toggleTopSiteSetting({ addSiteButtonHidden: target.checked });
  }

  function toggleTopSiteSetting(setting) {
    updateMainPanelComponentSetting("topSites", setting);
  }

  function togglePersistentSiteEditMode({ target }) {
    setPersistentSiteEditEnabled(target.checked);
    dispatchCustomEvent("enable-persistent-site-edit", target.checked);
  }

  function togglePersistentSitesVisibility({ target }) {
    toggleTopSiteSetting({ persistentSitesHidden: target.checked });

    if (target.checked) {
      setPersistentSiteEditEnabled(false);
      dispatchCustomEvent("enable-persistent-site-edit", false);
    }
  }

  function resetNotepadTextSize() {
    updateMainPanelComponentSetting("notepad", { textSize: 14, tabs: [] });
    dispatchCustomEvent("reset-notepad-text-size");
  }

  return (
    <div className="container-body setting-tab">
      <label className="setting">
        <span>Hide item bar</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.navHidden}
          onChange={() => toggleSetting("mainPanel", "navHidden")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <label className="setting">
        <span>Disable top sites</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.components.topSites.disabled}
          onChange={() => toggleComponent("topSites")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <label className="setting">
        <span>Disable notepad</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.components.notepad.disabled}
          onChange={() => toggleComponent("notepad")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      {/* <label className="setting">
        <span>Disable twitter</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.components.twitter.disabled}
          onChange={() => toggleComponent("twitter")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label> */}
      <label className="setting">
        <span>Disable RSS feed</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.components.rssFeed.disabled}
          onChange={() => toggleComponent("rssFeed")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <div className="settings-group">
        <div className="settings-group-top">
          <h4 className="settings-group-title">Top Sites</h4>
          {topSitesDirty && <button className="btn outline-btn settings-group-top-btn" onClick={resetTopSites}
            disabled={settings.components.topSites.disabled} title="Reset to default">Reset</button>}
        </div>
        <label className={`setting${settings.components.topSites.disabled ? " disabled" : ""}`}>
          <span>Show one row of top sites</span>
          <input type="checkbox" className="sr-only checkbox-input"
            disabled={settings.components.topSites.disabled}
            checked={settings.components.topSites.visibleItemCount === 4}
            onChange={toggleTopSiteItemCount}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
        </label>
        <label className={`setting${settings.components.topSites.disabled ? " disabled" : ""}`}>
          <span>Always open page in a new tab</span>
          <input type="checkbox" className="sr-only checkbox-input"
            disabled={settings.components.topSites.disabled}
            checked={settings.components.topSites.openInNewTab}
            onChange={toggleTopSiteOpenSetting}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
        </label>
        <label className={`setting${settings.components.topSites.disabled ? " disabled" : ""}`}>
          <span>Hide add site button</span>
          <input type="checkbox" className="sr-only checkbox-input"
            disabled={settings.components.topSites.disabled}
            checked={settings.components.topSites.addSiteButtonHidden}
            onChange={toggleTopSiteButtonVisibility}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
        </label>
        <label className={`setting${settings.components.topSites.disabled ? " disabled" : ""}`}>
          <span>Hide persistent sites</span>
          <input type="checkbox" className="sr-only checkbox-input"
            disabled={settings.components.topSites.disabled}
            checked={settings.components.topSites.persistentSitesHidden}
            onChange={togglePersistentSitesVisibility}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
        </label>
        <label className={`setting${settings.components.topSites.disabled || settings.components.topSites.persistentSitesHidden ? " disabled" : ""}`}>
          <span>Toggle persistent site edit mode</span>
          <input type="checkbox" className="sr-only toggle-input"
            disabled={settings.components.topSites.disabled || settings.components.topSites.persistentSitesHidden}
            checked={persistentSitesEditEnabled}
            onChange={togglePersistentSiteEditMode}/>
          <div className="toggle">
            <div className="toggle-item">Off</div>
            <div className="toggle-item">On</div>
          </div>
        </label>
      </div>
      <div className="settings-group">
        <div className="settings-group-top">
          <h4 className="settings-group-title">Notepad</h4>
        </div>
        <div className={`setting last-setting-tab-item ${settings.components.notepad.disabled ? " disabled" : ""}`}>
          <span>Reset notepad text size</span>
          <button className="btn" onClick={resetNotepadTextSize}>Reset</button>
        </div>
      </div>
    </div>
  );
}
