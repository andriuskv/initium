import { useState } from "react";
import { useSettings } from "contexts/settings-context";
import { dispatchCustomEvent } from "utils";

export default function MainPanelTab() {
  const { settings: { mainPanel: settings }, updateSetting, toggleSetting } = useSettings();
  const [persistentSitesEditEnabled, setPersistentSiteEditEnabled] = useState(false);

  function toggleComponent(item) {
    let disabledComponentCount = 0;
    settings.components[item].disabled = !settings.components[item].disabled;

    for (const key of Object.keys(settings.components)) {
      if (settings.components[key].disabled) {
        disabledComponentCount += 1;
      }
    }
    updateSetting("mainPanel", {
      navDisabled: disabledComponentCount > 2,
      disabled: disabledComponentCount === 4,
      components: { ...settings.components }
    });
  }

  function resetTopSites() {
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
    const { components } = settings;

    updateSetting("mainPanel", {
      components: {
        ...components,
        topSites: {
          ...components.topSites,
          ...setting
        }
      }
    });
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

  return (
    <div className="setting-tab">
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
      <label className="setting">
        <span>Disable twitter</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.components.twitter.disabled}
          onChange={() => toggleComponent("twitter")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
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
        <h4 className="settings-group-title">Top Sites</h4>
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
        <div className={`setting${settings.components.topSites.disabled ? " disabled" : ""}`}>
          <span>Restore default top sites</span>
          <button className="btn" onClick={resetTopSites}>Reset</button>
        </div>
        <label className={`setting${settings.components.topSites.disabled ? " disabled" : ""}`}>
          <span>Hide persistent sites</span>
          <input type="checkbox" className="sr-only checkbox-input"
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
    </div>
  );
}
