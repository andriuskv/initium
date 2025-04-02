import { useState, useRef, type ChangeEvent } from "react";
import { generateNoise, timeout } from "utils";
import { useSettings } from "contexts/settings";
import { updateSetting, addPanelNoise, removePanelNoise } from "services/settings";
import Icon from "components/Icon";
import "./appearance-tab.css";
import Wallpaper from "./Wallpaper";

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
    saturation: "48%",
    lightness: "60%"
  },
  {
    hue: "90deg",
    saturation: "62%",
    lightness: "68%"
  },
  {
    hue: "58deg",
    saturation: "66%",
    lightness: "68%"
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

export default function AppearanceTab({ locale }: { locale: any }) {
  const { settings: { appearance: settings }, updateContextSetting } = useSettings();
  const [colorIndex, setColorIndex] = useState(() => {
    return colors.findIndex(color => settings.accentColor.hue === color.hue && settings.accentColor.saturation === color.saturation);
  });
  const timeoutId = useRef(0);

  function handleAnimationSpeedChange({ target }: ChangeEvent) {
    const element = target as HTMLSelectElement;

    document.documentElement.style.setProperty("--animation-speed", element.value);
    updateContextSetting("appearance", { animationSpeed: Number(element.value) });
  }

  function handleRangeInputChange({ target }: ChangeEvent) {
    const { name, value } = target as HTMLInputElement;

    if (name === "panelBackgroundOpacity") {
      document.documentElement.style.setProperty("--panel-background-opacity", `${value}%`);
    }
    else if (name === "panelBackgroundBlur") {
      document.documentElement.style.setProperty("--panel-background-blur", `${value}px`);
    }

    timeoutId.current = timeout(() => {
      updateSetting("appearance", { [name]: Number(value) });
    }, 1000, timeoutId.current);
  }

  function handleNoiseChange({ target }: ChangeEvent) {
    const { name, value } = target as HTMLInputElement;
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

    timeoutId.current = timeout(() => {
      // Disable noise if either amount or opacity is 0
      if (num === 0) {
        removePanelNoise();
        localStorage.removeItem("noise");
      }
      else {
        const noise = generateNoise(amount, opacity);

        addPanelNoise(noise);
        localStorage.setItem("noise", noise);
      }
      updateContextSetting("appearance", {
        panelBackgroundNoiseOpacity: opacity,
        panelBackgroundNoiseAmount: amount
      });
    }, 1000, timeoutId.current);
  }

  function selectColor(index: number) {
    if (index !== colorIndex) {
      const color = colors[index];

      setColorIndex(index);

      document.documentElement.style.setProperty("--accent-hue", color.hue);
      document.documentElement.style.setProperty("--accent-saturation", color.saturation);
      document.documentElement.style.setProperty("--accent-lightness", color.lightness);

      timeoutId.current = timeout(() => {
        updateSetting("appearance", { accentColor: color });
      }, 1000, timeoutId.current);
    }
  }

  return (
    <div className="container-body setting-tab">
      <label className="setting">
        <span>{locale.settings.appearance.animations_label}</span>
        <div className="select-container">
          <select className="input select" onChange={handleAnimationSpeedChange} value={settings.animationSpeed}>
            <option value="0">{locale.settings.appearance.animation_speed_disabled}</option>
            <option value="0.5">{locale.settings.appearance.animation_speed_fast}</option>
            <option value="1">{locale.settings.appearance.animation_speed_normal}</option>
            <option value="2">{locale.settings.appearance.animation_speed_slow}</option>
          </select>
        </div>
      </label>
      <div className="settings-group">
        <div className="settings-group-top">
          <h4 className="settings-group-title">{locale.settings.appearance.accent_color_group_title}</h4>
        </div>
        <ul className="setting setting-appearance-tab-accent-colors">
          {colors.map((color, index) => (
            <li key={index}>
              <button className={`btn setting-appearance-tab-accent-color-btn${colorIndex === index ? " selected" : ""}`}
                style={{ backgroundColor: `hsl(${color.hue} ${color.saturation} ${color.lightness})` }}
                onClick={() => selectColor(index)}>
                {colorIndex === index ? <Icon id="check"/> : null}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="settings-group">
        <div className="settings-group-top">
          <h4 className="settings-group-title">{locale.settings.appearance.panel_group_title}</h4>
        </div>
        <label className="setting">
          <span>{locale.settings.appearance.bg_opacity_label}</span>
          <input type="range" className="range-input" min="0" max="100" step="5"
            defaultValue={settings.panelBackgroundOpacity} onChange={handleRangeInputChange} name="panelBackgroundOpacity"/>
        </label>
        <label className="setting">
          <span>{locale.settings.appearance.bg_blur_label}</span>
          <input type="range" className="range-input" min="0" max="32" step="1"
            defaultValue={settings.panelBackgroundBlur} onChange={handleRangeInputChange} name="panelBackgroundBlur"/>
        </label>
        <label className="setting">
          <span>{locale.settings.appearance.bg_noise_amount_label}</span>
          <input type="range" className="range-input" min="0" max="0.4" step="0.01"
            defaultValue={settings.panelBackgroundNoiseAmount} onChange={handleNoiseChange} name="panelBackgroundNoiseAmount"/>
        </label>
        <label className="setting">
          <span>{locale.settings.appearance.bg_noise_opacity_label}</span>
          <input type="range" className="range-input" min="0" max="0.05" step="0.0025"
            defaultValue={settings.panelBackgroundNoiseOpacity} onChange={handleNoiseChange} name="panelBackgroundNoiseOpacity"/>
        </label>
      </div>
      <Wallpaper locale={locale}/>
    </div>
  );
}
