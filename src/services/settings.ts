import type { Settings, MainPanelSettings, MainPanelComponents } from "types/settings";
import { generateNoise } from "../utils";

let settings = initSettings();

function initSettings() {
  const item = localStorage.getItem("settings");
  const settings: Partial<Settings> = item ? JSON.parse(item) : {};
  return fillMissing(settings, getDefault());
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
      greeting: {
        disabled: false,
        textSize: 1
      },
      middleTopOrder: [
        {
          id: "timers",
          name: "Mini timer"
        },
        {
          id: "clock",
          name: "Clock"
        },
        {
          id: "greeting",
          name: "Greeting"
        }
      ]
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
      clockFullscreenEnabled: false,
      dateHidden: false,
      dateScale: 1.1,
      datePosition: "bottom",
      dateAlignment: "center",
      dateLocale: "en-US",
      firstWeekday: 0,
      worldClocksHidden: false,
      reminderPreviewHidden: false,
      showTomorrowReminers: false
    },
    mainPanel: {
      navHidden: false,
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

function fillMissing(target: Partial<Settings>, source: Settings) {
  for (const key of Object.keys(source)) {
    if (typeof target[key] === "undefined") {
      target[key] = source[key];
    }
    else if (typeof target[key] === "object") {
      target[key] = fillMissing(target[key], source[key]);
    }
  }
  return target as Settings;
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

function setSetting(name: string, value: Settings[keyof Settings]) {
  settings[name] = value;
  localStorage.setItem("settings", JSON.stringify(settings));
  return settings;
}

function updateSetting(name: string, value: Partial<Settings[keyof Settings]>) {
  settings[name] = { ...settings[name], ...value };
  localStorage.setItem("settings", JSON.stringify(settings));
  return settings;
}

function updateMainPanelComponentSetting(name: keyof MainPanelComponents, setting: MainPanelComponents[keyof MainPanelComponents]) {
  const { navHidden, components } = settings.mainPanel;
  const mainPanel: MainPanelSettings = {
    navHidden,
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
