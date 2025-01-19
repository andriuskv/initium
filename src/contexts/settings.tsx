import type { PropsWithChildren } from "react";
import type { Settings, MainPanelComponents } from "types/settings";
import { createContext, useState, use, useMemo } from "react";
import * as settingsService from "services/settings";

type SettingsContextType = {
  settings: Settings;
  updateContextSetting: (name: string, setting: Partial<Settings[keyof Settings]>) => void;
  updateMainPanelComponentSetting: (name: keyof MainPanelComponents, setting: Partial<MainPanelComponents[keyof MainPanelComponents]>) => void;
  toggleSetting: (groupName: string, settingName: string) => void;
  resetSettings: () => Settings;
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

  // function updateMainPanelComponentSetting(name: keyof MainPanelComponents, setting: MainPanelComponents[keyof MainPanelComponents]) {
  function updateMainPanelComponentSetting(name: keyof MainPanelComponents, setting: Partial<MainPanelComponents[keyof MainPanelComponents]>) {
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

  return <SettingsContext value={memoizedValue}>{children}</SettingsContext>;
}

function useSettings() {
  return use(SettingsContext);
}

export {
  SettingsProvider,
  useSettings
};
