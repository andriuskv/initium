const settings = initSettings();

function initSettings() {
  const settings = JSON.parse(localStorage.getItem("settings")) || {};

  settings.timeDate ??= {};

  if (settings.timeDate.dateAboveClock) {
    delete settings.timeDate.dateAboveClock;
    settings.timeDate.datePosition = "top";
  }
  else if (settings.timeDate.datePosition === "right") {
    settings.timeDate.datePosition = "top";
  }

  settings.appearance ??= {};

  if (settings.background) {
    settings.appearance.wallpaper ??= {};
    settings.appearance.wallpaper = settings.background;
    delete settings.background;
  }

  settings.general ??= {};

  if (settings.general.backgroundOpacity) {
    settings.appearance.panelBackgroundOpacity = settings.general.backgroundOpacity;
    delete settings.general.backgroundOpacity;
  }

  if (settings.general.backgroundBlurRadius) {
    settings.appearance.panelBackgroundBlur = settings.general.backgroundBlurRadius;
    delete settings.general.backgroundBlurRadius;
  }
  return copyObject(settings, getDefault());
}

function getDefault() {
  return {
    general: {
      centerClock: false,
      greetingDisabled: false
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
      clockStyle: "Inter",
      clockScale: 1,
      boldedClock: false,
      dateHidden: false,
      boldedDate: false,
      dateScale: 1.2,
      dateOffset: 8,
      datePosition: "bottom",
      dateAligment: "center",
      dontChangeDateStyle: false,
      dateLocale: "en-US"
    },
    mainPanel: {
      navHidden: false,
      components: {
        topSites: {
          disabled: false,
          visibleItemCount: 4,
          openInNewTab: false,
          addSiteButtonHidden: false
        },
        notepad: { disabled: false },
        twitter: { disabled: false },
        rssFeed: { disabled: false }
      }
    },
    weather: {
      disabled: false,
      useGeo: false,
      cityName: "",
      units: "C"
    },
    topPanel: {
      alarmVolume: 0.2,
      fullscreenTextScale: 1.5
    },
    pomodoro: {
      duration: 25,
      short: 5,
      long: 15
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
  getSettings,
  getSetting,
  setSetting,
  updateSetting
};
