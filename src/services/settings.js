const settings = initSettings();

function initSettings() {
  const settings = JSON.parse(localStorage.getItem("settings")) || {};

  if (settings.dateAboveClock) {
    delete settings.dateAboveClock;
    settings.datePosition = "top";
  }
  return copyObject(settings, getDefault());
}

function getDefault() {
  return {
    general: {
      centerClock: false,
      backgroundOpacity: 50,
      backgroundBlurRadius: 12,
      greetingDisabled: false
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
    topPanel: {
      alarmVolume: 0.2,
      fullscreenTextScale: 1.5
    },
    timeDate: {
      format: 24,
      clockDisabled: false,
      clockStyle: "Inter",
      clockScale: 1,
      boldedClock: false,
      dateHidden: false,
      boldedDate: true,
      dateScale: 1,
      dateOffset: 8,
      datePosition: "bottom",
      dateAligment: "end",
      dontChangeDateStyle: false
    },
    background: {
      url: ""
    },
    weather: {
      disabled: false,
      useGeo: false,
      cityName: "",
      units: "C"
    },
    pomodoro: {
      duration: 25,
      short: 5,
      long: 15
    }
  };
}

function copyObject(obj, mainObj) {
  for (const key of Object.keys(mainObj)) {
    if (typeof obj[key] === "undefined") {
      obj[key] = mainObj[key];
    }
    else if (typeof obj[key] === "object") {
      obj[key] = copyObject(obj[key], mainObj[key]);
    }
  }
  return obj;
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
