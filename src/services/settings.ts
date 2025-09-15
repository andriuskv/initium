import type { Settings, MainPanelSettings, MainPanelComponents } from "types/settings";
import { generateNoise, getLocalStorageItem, fillMissing } from "utils";

let settings = initSettings();

function initSettings() {
  const settings = getLocalStorageItem<Partial<Settings>>("settings") || {};
  return fillMissing(settings, getDefault()) as Settings;
}

function initAppearanceSettings(settings: Settings["appearance"]) {
  document.documentElement.style.setProperty("--animation-speed", settings.animationSpeed.toString());

  document.documentElement.style.setProperty("--accent-hue", settings.accentColor.hue);
  document.documentElement.style.setProperty("--accent-saturation", settings.accentColor.saturation);
  document.documentElement.style.setProperty("--accent-lightness", settings.accentColor.lightness);

  document.documentElement.style.setProperty("--panel-background-opacity", `${settings.panelBackgroundOpacity}%`);
  document.documentElement.style.setProperty("--panel-background-blur", `${settings.panelBackgroundBlur}px`);

  const noise = localStorage.getItem("noise");

  if (noise) {
    addPanelNoise(noise);
  }
  else if (settings.panelBackgroundNoiseAmount && settings.panelBackgroundNoiseOpacity) {
    const noise = generateNoise(settings.panelBackgroundNoiseAmount, settings.panelBackgroundNoiseOpacity);

    addPanelNoise(noise);
  }
}

function getDefault(): Settings {
  return {
    general: {
      locale: "en",
      openLinkInNewTab: true,
      stickyNotesDisabled: false,
      shortcutsDisabled: false,
      calendarDisabled: false,
      rememberWidgetState: false,
      greeting: {
        disabled: false,
        textSize: 1
      },
      middleTopOrder: [
        {
          id: "timers"
        },
        {
          id: "clock"
        },
        {
          id: "greeting"
        }
      ],
      placement: {
        "top-left": {
          id: "tasks"
        },
        "top-right": {
          id: "weather"
        },
        "bottom-left": {
          id: "empty"
        },
        "bottom-right": {
          id: "secondary"
        }
      }
    },
    appearance: {
      animationSpeed: 1,
      accentColor: { hue: "205deg", saturation: "80%", lightness: "56%" },
      panelBackgroundOpacity: 50,
      panelBackgroundBlur: 12,
      panelBackgroundNoiseAmount: 0.2,
      panelBackgroundNoiseOpacity: 0.02,
      wallpaper: { provider: "unsplash", url: "" }
    },
    timeDate: {
      format: 24,
      clockDisabled: false,
      clockStyle: "default",
      clockScale: 1,
      centerClock: false,
      dateHidden: false,
      dateScale: 1.1,
      datePosition: "bottom",
      dateAlignment: "center",
      dateLocale: "default",
      firstWeekday: 0,
      worldClocksHidden: false,
      reminderPreviewHidden: false,
      showTomorrowReminers: false
    },
    mainPanel: {
      navHidden: false,
      navDisabled: false,
      components: {
        topSites: {
          disabled: false,
          visibleItemCount: 8,
          openInNewTab: false,
          addSiteButtonHidden: false,
          persistentSitesHidden: false
        },
        notepad: {
          disabled: false,
          textSize: 14
        },
        rssFeed: { disabled: false }
      }
    },
    tasks: {
      disabled: false,
      defaultGroupVisible: false,
      emptyGroupsHidden: false,
      countSubtasks: false,
      repeatHistoryHidden: false,
      showCompletedRepeatingTasks: false
    },
    weather: {
      disabled: false,
      useGeo: false,
      cityName: "",
      units: "C",
      speedUnits: "m/s"
    },
    timers: {
      disabled: false,
      volume: 0.2,
      fullscreenTextScale: 2,
      showMinimal: false,
      timer: {
        usePresetNameAsLabel: false
      },
      pomodoro: {
        focus: 25,
        short: 5,
        long: 15
      }
    }
  };
}

function resetSettings() {
  localStorage.removeItem("settings");
  settings = initSettings();
  return settings;
}

function getSettings() {
  return settings;
}

function getSetting(name: keyof Settings) {
  return settings[name];
}

function setSetting(name: keyof Settings, value: Settings[keyof Settings]) {
  (settings[name] as Settings[keyof Settings]) = value;
  localStorage.setItem("settings", JSON.stringify(settings));
  return settings;
}

function updateSetting(name: keyof Settings, value: Partial<Settings[keyof Settings]>) {
  (settings[name] as Settings[keyof Settings]) = { ...settings[name], ...value };
  localStorage.setItem("settings", JSON.stringify(settings));
  return settings;
}

function updateMainPanelComponentSetting(name: keyof MainPanelComponents, setting: Partial<MainPanelComponents[keyof MainPanelComponents]>) {
  const { components, ...rest } = settings.mainPanel;
  const mainPanel: MainPanelSettings = {
    ...rest,
    components: {
      ...components,
      [name]: {
        ...components[name],
        ...setting
      }
    }
  };

  return updateSetting("mainPanel", mainPanel);
}

function addPanelNoise(noise: string) {
  const sheet = new CSSStyleSheet();

  sheet.replaceSync(`:root {
    --panel-background-noise: url("${noise}");
  }`);
  document.adoptedStyleSheets = [sheet];
}

function removePanelNoise() {
  document.adoptedStyleSheets = [];
}

export {
  initAppearanceSettings,
  resetSettings,
  getDefault,
  getSettings,
  getSetting,
  setSetting,
  updateSetting,
  updateMainPanelComponentSetting,
  addPanelNoise,
  removePanelNoise
};
