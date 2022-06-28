const settings = initSettings();

function initSettings() {
  const settings = JSON.parse(localStorage.getItem("settings")) || {};

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
      clockDisabled: false,
      dateAligment: "right",
      dateAboveClock: false,
      clockStyle: "Inter",
      dontChangeDateStyle: false,
      dateHidden: false,
      clockScale: 1,
      format: 24
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
