import { createContext, useState, useContext, useMemo } from "react";
import * as settingsService from "services/settings";

const SettingsContext = createContext();

function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => settingsService.getSettings());
  const memoizedValue = useMemo(() => {
    return {
      settings,
      setSetting,
      updateSetting,
      updateMainPanelComponentSetting,
      toggleSetting,
      resetSettings
    };
  }, [settings]);

  function setSetting(group, setting) {
    setSettings({ ...settingsService.setSetting({ [group]: setting }) });
  }

  function updateSetting(group, setting) {
    const settings = settingsService.updateSetting({ [group]: setting });

    setSettings({ ...settings });
  }

  function updateMainPanelComponentSetting(name, setting) {
    const settings = settingsService.updateMainPanelComponentSetting(name, setting);

    setSettings({ ...settings });
  }

  function toggleSetting(group, settingName) {
    updateSetting(group, {
      [settingName]: !settings[group][settingName]
    });
  }

  function resetSettings() {
    const settings = { ...settingsService.resetSettings() };

    setSettings(settings);
    return settings;
  }

  return <SettingsContext.Provider value={memoizedValue}>{children}</SettingsContext.Provider>;
}

function useSettings() {
  return useContext(SettingsContext);
}

export {
  SettingsProvider,
  useSettings
};
