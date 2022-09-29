import { useState, useEffect, useRef } from "react";
import { dispatchCustomEvent, generateNoise } from "utils";
import { useSettings } from "contexts/settings-context";
import { getWallpaperInfo, resetWallpaperInfo, setUrlWallpaper, setIDBWallpaper } from "services/wallpaper";
import { updateSetting } from "services/settings";
import Modal from "components/Modal";
import Icon from "components/Icon";
import "./appearance-tab.css";

const colors = [
  {
    hue: "205deg",
    saturation: "80%",
    lightness: "56%"
  },
  {
    hue: "165deg",
    saturation: "80%",
    lightness: "40%"
  },
  {
    hue: "90deg",
    saturation: "80%",
    lightness: "56%"
  },
  {
    hue: "58deg",
    saturation: "80%",
    lightness: "56%"
  },
  {
    hue: "45deg",
    saturation: "80%",
    lightness: "56%"
  },
  {
    hue: "0deg",
    saturation: "80%",
    lightness: "56%"
  },
  {
    hue: "305deg",
    saturation: "80%",
    lightness: "56%"
  },
  {
    hue: "270deg",
    saturation: "80%",
    lightness: "56%"
  },
  {
    hue: "205deg",
    saturation: "70%",
    lightness: "66%"
  },
  {
    hue: "165deg",
    saturation: "60%",
    lightness: "50%"
  },
  {
    hue: "90deg",
    saturation: "70%",
    lightness: "66%"
  },
  {
    hue: "58deg",
    saturation: "70%",
    lightness: "66%"
  },
  {
    hue: "45deg",
    saturation: "70%",
    lightness: "66%"
  },
  {
    hue: "0deg",
    saturation: "70%",
    lightness: "66%"
  },
  {
    hue: "305deg",
    saturation: "70%",
    lightness: "66%"
  },
  {
    hue: "270deg",
    saturation: "70%",
    lightness: "66%"
  }
];

export default function AppearanceTab() {
  const { settings: { appearance: settings }, updateSetting: updateContextSetting } = useSettings();
  const [wallpaperInfo, setWallpaperInfo] = useState(() => getWallpaperInfo());
  const [wallpaperForm, setWallpaperForm] = useState(null);
  const [colorIndex, setColorIndex] = useState(() => {
    return colors.findIndex(color => settings.accentColor.hue === color.hue && settings.accentColor.saturation === color.saturation);
  });
  const timeoutId = useRef(0);

  useEffect(() => {
    window.addEventListener("wallpaper-info-update", handleWallpaperInfoUpdate);

    return () => {
      window.removeEventListener("wallpaper-info-update", handleWallpaperInfoUpdate);
    };
  }, []);

  function handleRangeInputChange({ target }) {
    const { name, value } = target;

    if (name === "panelBackgroundOpacity") {
      document.body.style.setProperty("--panel-background-opacity", `${value}%`);
    }
    else if (name === "panelBackgroundBlur") {
      document.body.style.setProperty("--panel-background-blur", `${value}px`);
    }

    clearTimeout(timeoutId.current);
    timeoutId.current = setTimeout(() => {
      updateSetting({ appearance: { [name]: Number(value) } });
    }, 1000);
  }

  function handleNoiseChange({ target }) {
    const { name, value } = target;
    const num = Number(value);
    let amount = 0;
    let opacity = 0;

    if (name === "panelBackgroundNoiseOpacity") {
      opacity = num;
      amount = settings.panelBackgroundNoiseAmount;
    }
    else if (name === "panelBackgroundNoiseAmount") {
      amount = num;
      opacity = settings.panelBackgroundNoiseOpacity;
    }
    clearTimeout(timeoutId.current);
    timeoutId.current = setTimeout(() => {
      // Disable noise if either amount or opacity is 0
      if (num === 0) {
        document.body.style.setProperty("--panel-background-noise", "");
        localStorage.removeItem("noise");
      }
      else {
        const noise = generateNoise(amount, opacity);

        document.body.style.setProperty("--panel-background-noise", `url(${noise})`);
        localStorage.setItem("noise", noise);
      }
      updateContextSetting("appearance", {
        panelBackgroundNoiseOpacity: opacity,
        panelBackgroundNoiseAmount: amount
      });
    }, 1000);
  }

  function handleWallpaperInfoUpdate({ detail }) {
    setWallpaperInfo(detail);
  }

  function resetWallpaper() {
    updateContextSetting("appearance", { wallpaper: { url: "" } });
    resetWallpaperInfo();
  }

  function showWallpaperViewer() {
    dispatchCustomEvent("wallpaper-viewer-visible");
  }

  function showWallpaperForm() {
    setWallpaperForm({ visible: true });
  }

  function hideWallpaperForm() {
    setWallpaperForm(null);
  }

  function handleWallpaperFormSubmit(event) {
    const [input] = event.target.elements;
    const image = new Image();

    event.preventDefault();

    if (!input.value) {
      setWallpaperForm(null);
      return;
    }

    image.onload = () => {
      setWallpaper(input.value);
    };

    image.onerror = () => {
      setWallpaperForm({
        ...wallpaperForm,
        invalid: true
      });
    };
    image.src = input.value;
  }

  function setWallpaper(url) {
    setWallpaperForm(null);
    updateContextSetting("appearance", { wallpaper: { type: "url", url } });
    setUrlWallpaper(url);
  }

  async function selectFile() {
    const image = await getImageFile();

    await setIDBWallpaper(image);
    updateContextSetting("appearance", { wallpaper: { type: "blob", id: image.name } });
  }

  function getImageFile() {
    return new Promise(resolve => {
      const input = document.createElement("input");

      input.setAttribute("type", "file");
      input.setAttribute("accept", "image/*");
      input.onchange = ({ target }) => {
        resolve(target.files[0]);
        target = "";
        input.onchange = null;
      };
      input.click();
    });
  }


  function selectColor(index) {
    if (index !== colorIndex) {
      const color = colors[index];

      setColorIndex(index);

      document.body.style.setProperty("--accent-hue", color.hue);
      document.body.style.setProperty("--accent-saturation", color.saturation);
      document.body.style.setProperty("--accent-lightness", color.lightness);

      clearTimeout(timeoutId.current);
      timeoutId.current = setTimeout(() => {
        updateSetting({ appearance: { accentColor: color } });
      }, 1000);
    }
  }

  function renderAccentColors() {
    return (
      <ul className="setting setting-appearance-tab-accent-colors">
        {colors.map((color, index) => (
          <li key={index}>
            <button className={`btn setting-appearance-tab-accent-color-btn${colorIndex === index ? " selected" : ""}`}
              style={{ backgroundColor: `hsl(${color.hue}, ${color.saturation}, ${color.lightness})` }}
              onClick={() => selectColor(index)}>
              {colorIndex === index ? <Icon id="check"/> : null}
            </button>
          </li>
        ))}
      </ul>
    );
  }

  function renderWallpaperForm() {
    return (
      <Modal hide={hideWallpaperForm}>
        <form onSubmit={handleWallpaperFormSubmit}>
          <h4 className="modal-title modal-title-center">Set wallpaper from URL</h4>
          <input type="text" className="input setting-wallpaper-form-input" name="input"placeholder="URL" autoComplete="off"/>
          {wallpaperForm.invalid && <div className="setting-wallpaper-form-message">URL does not contain valid image.</div>}
          <div className="modal-actions">
            <button type="button" className="btn text-btn" onClick={hideWallpaperForm}>Cancel</button>
            <button className="btn">Set</button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <div className="setting-tab">
      <div className="settings-group">
        <h4 className="settings-group-title">Accent color</h4>
        {renderAccentColors()}
      </div>
      <div className="settings-group">
        <h4 className="settings-group-title">Panel</h4>
        <label className="setting">
          <span>Background opacity</span>
          <input type="range" className="range-input" min="0" max="100" step="5"
            defaultValue={settings.panelBackgroundOpacity} onChange={handleRangeInputChange} name="panelBackgroundOpacity"/>
        </label>
        <label className="setting">
          <span>Background blur</span>
          <input type="range" className="range-input" min="0" max="24" step="1"
            defaultValue={settings.panelBackgroundBlur} onChange={handleRangeInputChange} name="panelBackgroundBlur"/>
        </label>
        <label className="setting">
          <span>Background noise amount</span>
          <input type="range" className="range-input" min="0" max="0.25" step="0.01"
            defaultValue={settings.panelBackgroundNoiseAmount} onChange={handleNoiseChange} name="panelBackgroundNoiseAmount"/>
        </label>
        <label className="setting">
          <span>Background noise opacity</span>
          <input type="range" className="range-input" min="0" max="0.08" step="0.005"
            defaultValue={settings.panelBackgroundNoiseOpacity} onChange={handleNoiseChange} name="panelBackgroundNoiseOpacity"/>
        </label>
      </div>
      <div className="settings-group">
        <h4 className="settings-group-title">Wallpaper</h4>
        <div className="setting setting-wallpaper">
          <div className="setting-wallpaper-title">Set wallpaper from...</div>
          {settings.wallpaper.url || settings.wallpaper.id ? (
            <button className="btn icon-btn setting-wallpaper-viewer-btn"
              onClick={showWallpaperViewer}
              title="Adjust wallpaper position">
              <Icon id="image"/>
            </button>
          ) : null}
          <div className="setting-wallpaper-items">
            <div className="setting-wallpaper-item">
              <button className="btn text-btn setting-wallpaper-item-btn" onClick={showWallpaperForm}>URL</button>
            </div>
            <div className="setting-wallpaper-item">
              <button className="btn text-btn setting-wallpaper-item-btn" onClick={selectFile}>Device</button>
            </div>
          </div>
        </div>
        <div className="setting">
          <span>Reset wallpaper</span>
          <button className="btn" onClick={resetWallpaper}>Reset</button>
        </div>
        {wallpaperInfo && (
          <p className="setting-wallpaper-info">Wallpaper image by <a href={`https://unsplash.com/@${wallpaperInfo.username}?utm_source=initium&utm_medium=referral`} className="setting-wallpaper-info-link">{wallpaperInfo.name}</a> on <a href="https://unsplash.com/?utm_source=initium&utm_medium=referral" className="setting-wallpaper-info-link">Unsplash</a></p>
        )}
      </div>
      {wallpaperForm && renderWallpaperForm()}
    </div>
  );
}
