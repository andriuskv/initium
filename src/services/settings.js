const settings = initSettings();

function initSettings() {
  const settings = JSON.parse(localStorage.getItem("settings")) || {};

  return copyObject(settings, getDefault());
}

function getDefault() {
  return {
    general: {
      backgroundOpacity: 50,
      backgroundBlurRadius: 12
    },
    mainPanel: {
      navHidden: false,
      components: {
        topSites: {
          disabled: false,
          visibleItemCount: 4,
          addSiteButtonHidden: false
        },
        notepad: { disabled: false },
        twitter: { disabled: false },
        rssFeed: { disabled: false }
      }
    },
    timeDate: {
      clockDisabled: false,
      dateHidden: false,
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
