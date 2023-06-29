import { generateNoise } from "../utils";

let settings = initSettings();

function initSettings() {
  let settings = JSON.parse(localStorage.getItem("settings")) || {};

  settings = copyObject(settings, getDefault());

  delete settings.mainPanel.components.twitter;

  return settings;
}

function initAppearanceSettings(settings) {
  document.body.style.setProperty("--accent-hue", settings.accentColor.hue);
  document.body.style.setProperty("--accent-saturation", settings.accentColor.saturation);
  document.body.style.setProperty("--accent-lightness", settings.accentColor.lightness);

  document.body.style.setProperty("--panel-background-opacity", `${settings.panelBackgroundOpacity}%`);
  document.body.style.setProperty("--panel-background-blur", `${settings.panelBackgroundBlur}px`);

  const noise = localStorage.getItem("noise");

  if (noise) {
    document.body.style.setProperty("--panel-background-noise", `url(${noise})`);
  }
  else if (settings.panelBackgroundNoiseAmount && settings.panelBackgroundNoiseOpacity) {
    const noise = generateNoise(settings.panelBackgroundNoiseAmount, settings.panelBackgroundNoiseOpacity);

    document.body.style.setProperty("--panel-background-noise", `url(${noise})`);
    localStorage.setItem("noise", noise);
  }
}

function getDefault() {
  return {
    general: {
      greetingDisabled: false,
      shortcutsDisabled: false,
      calendarDisabled: false
    },
    appearance: {
      accentColor: { hue: "205deg", saturation: "80%", lightness: "56%" },
      panelBackgroundOpacity: 50,
      panelBackgroundBlur: 12,
      panelBackgroundNoiseAmount: 0.12,
      panelBackgroundNoiseOpacity: 0.02,
      wallpaper: { url: "" }
    },
    timeDate: {
      format: 24,
      clockDisabled: false,
      clockFont: "Inter",
      clockStyle: "default",
      clockScale: 1,
      boldedClock: false,
      centerClock: false,
      dateHidden: false,
      boldedDate: false,
      dateScale: 1.3,
      dateOffset: 12,
      datePosition: "bottom",
      dateAlignment: "center",
      dontChangeDateStyle: false,
      dateLocale: "en-US",
      firstWeekday: 0
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
        notepad: { disabled: false },
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
      alarmVolume: 0.2,
      fullscreenTextScale: 1.5,
      showMinimal: false,
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

export {
  initAppearanceSettings,
  resetSettings,
  getSettings,
  getSetting,
  setSetting,
  updateSetting
};
