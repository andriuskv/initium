import { generateNoise } from "../utils";

let settings = initSettings();

function initSettings() {
  let settings = JSON.parse(localStorage.getItem("settings")) || {};

  settings = copyObject(settings, getDefault());

  delete settings.mainPanel.components.twitter;

  return settings;
}

function initAppearanceSettings(settings) {
  document.documentElement.style.setProperty("--animation-speed", settings.animationSpeed);

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

function getDefault() {
  return {
    general: {
      locale: "en",
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
      dateHidden: false,
      dateScale: 1.1,
      datePosition: "bottom",
      dateAlignment: "center",
      dateLocale: "en-US",
      firstWeekday: 0,
      worldClocksHidden: false
    },
    mainPanel: {
      navHidden: false,
      components: {
        topSites: {
          disabled: false,
          visibleItemCount: 4,
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

function copyObject(target, source) {
  for (const key of Object.keys(source)) {
    if (typeof target[key] === "undefined") {
      target[key] = source[key];
    }
    else if (typeof target[key] === "object") {
      target[key] = copyObject(target[key], source[key]);
    }
  }
  return target;
}

function resetSettings() {
  localStorage.removeItem("settings");
  settings = initSettings();
  return settings;
}

function getSettings() {
  return settings;
}

function getSetting(setting) {
  return settings[setting] || {};
}

function setSetting(setting) {
  const [settingFor] = Object.keys(setting);
  settings[settingFor] = setting[settingFor];

  localStorage.setItem("settings", JSON.stringify(settings));
  return settings;
}

function updateSetting(setting) {
  const [settingFor] = Object.keys(setting);
  settings[settingFor] = { ...settings[settingFor], ...setting[settingFor] };

  localStorage.setItem("settings", JSON.stringify(settings));
  return settings;
}

function updateMainPanelComponentSetting(name, setting) {
  const { components } = settings.mainPanel;

  return updateSetting({
    mainPanel: {
      components: {
        ...components,
        [name]: {
          ...components[name],
          ...setting
        }
      }
    }
  });
}

function addPanelNoise(noise) {
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
