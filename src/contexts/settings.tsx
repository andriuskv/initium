import { PropsWithChildren, createContext, useState, useContext, useMemo } from "react";
import * as settingsService from "services/settings";
import { Settings, MainPanelComponents } from "types/settings";

type SettingsContextType = {
  settings: Settings;
  updateContextSetting: (name: string, setting: Settings[keyof Settings]) => void;
  updateMainPanelComponentSetting: (name: keyof MainPanelComponents, setting: MainPanelComponents[keyof MainPanelComponents]) => void;
  toggleSetting: (groupName: string, settingName: string) => void;
  resetSettings: () => void;
};

const SettingsContext = createContext<SettingsContextType>({} as SettingsContextType);

function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<Settings>(() => settingsService.getSettings());
  const memoizedValue = useMemo(() => {
    return {
      settings,
      updateContextSetting,
      updateMainPanelComponentSetting,
      toggleSetting,
      resetSettings
    };
  }, [settings]);

  function updateContextSetting(name: string, setting: Partial<Settings[keyof Settings]>) {
    const settings = settingsService.updateSetting(name, setting);

    setSettings({ ...settings });
  }

  function updateMainPanelComponentSetting(name: keyof MainPanelComponents, setting: MainPanelComponents[keyof MainPanelComponents]) {
    const settings = settingsService.updateMainPanelComponentSetting(name, setting);

    setSettings({ ...settings });
  }

  function toggleSetting(groupName: string, settingName: string) {
    updateContextSetting(groupName, {
      [settingName]: !settings[groupName][settingName]
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
