import { useState } from "react";
import { useSettings } from "contexts/settings";
import { dispatchCustomEvent } from "utils";

export default function MainPanelTab({ locale, hide }) {
  const { settings: { mainPanel: settings }, updateSetting, updateMainPanelComponentSetting, toggleSetting } = useSettings();
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

  function togglePersistentSiteEditMode() {
    hide();
    dispatchCustomEvent("enable-persistent-site-edit");
  }

  function togglePersistentSitesVisibility({ target }) {
    toggleTopSiteSetting({ persistentSitesHidden: target.checked });

    if (target.checked) {
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
        <span>{locale.settings.main_panel.hide_item_bar_label}</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.navHidden}
          onChange={() => toggleSetting("mainPanel", "navHidden")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <label className="setting">
        <span>{locale.settings.main_panel.disable_top_sites_label}</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.components.topSites.disabled}
          onChange={() => toggleComponent("topSites")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <label className="setting">
        <span>{locale.settings.main_panel.disable_notepad_label}</span>
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
        <span>{locale.settings.main_panel.disable_rss_feed_label}</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.components.rssFeed.disabled}
          onChange={() => toggleComponent("rssFeed")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <div className="settings-group">
        <div className="settings-group-top">
          <h4 className="settings-group-title">{locale.settings.main_panel.top_sites_group_title}</h4>
          {topSitesDirty && <button className="btn outline-btn settings-group-top-btn" onClick={resetTopSites}
            disabled={settings.components.topSites.disabled}>{locale.global.reset}</button>}
        </div>
        <label className={`setting${settings.components.topSites.disabled ? " disabled" : ""}`}>
          <span>{locale.settings.main_panel.one_top_sites_row_label}</span>
          <input type="checkbox" className="sr-only checkbox-input"
            disabled={settings.components.topSites.disabled}
            checked={settings.components.topSites.visibleItemCount === 4}
            onChange={toggleTopSiteItemCount}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
        </label>
        <label className={`setting${settings.components.topSites.disabled ? " disabled" : ""}`}>
          <span>{locale.settings.main_panel.new_tab_top_sites_label}</span>
          <input type="checkbox" className="sr-only checkbox-input"
            disabled={settings.components.topSites.disabled}
            checked={settings.components.topSites.openInNewTab}
            onChange={toggleTopSiteOpenSetting}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
        </label>
        <label className={`setting${settings.components.topSites.disabled ? " disabled" : ""}`}>
          <span>{locale.settings.main_panel.hide_add_button_label}</span>
          <input type="checkbox" className="sr-only checkbox-input"
            disabled={settings.components.topSites.disabled}
            checked={settings.components.topSites.addSiteButtonHidden}
            onChange={toggleTopSiteButtonVisibility}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
        </label>
        <label className={`setting${settings.components.topSites.disabled ? " disabled" : ""}`}>
          <span>{locale.settings.main_panel.hide_persistent_sites_label}</span>
          <input type="checkbox" className="sr-only checkbox-input"
            disabled={settings.components.topSites.disabled}
            checked={settings.components.topSites.persistentSitesHidden}
            onChange={togglePersistentSitesVisibility}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
        </label>
        <div className={`setting${settings.components.topSites.disabled || settings.components.topSites.persistentSitesHidden ? " disabled" : ""}`}>
          <span>{locale.settings.main_panel.persistent_site_edit_label}</span>
          <button className="btn" onClick={togglePersistentSiteEditMode}
            disabled={settings.components.topSites.disabled || settings.components.topSites.persistentSitesHidden}>{locale.global.enable}</button>
        </div>
      </div>
      <div className="settings-group">
        <div className="settings-group-top">
          <h4 className="settings-group-title">{locale.settings.main_panel.notepad_group_title}</h4>
        </div>
        <div className={`setting last-setting-tab-item ${settings.components.notepad.disabled ? " disabled" : ""}`}>
          <span>{locale.settings.main_panel.reset_notepad_label}</span>
          <button className="btn" onClick={resetNotepadTextSize}>{locale.global.reset}</button>
        </div>
      </div>
    </div>
  );
}
