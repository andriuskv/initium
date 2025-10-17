import { useRef, type ChangeEvent } from "react";
import { generateNoise, timeout } from "utils";
import { useSettings } from "contexts/settings";
import { updateSetting, addPanelNoise, removePanelNoise } from "services/settings";
import Wallpaper from "./Wallpaper";
import ColorPicker from "./ColorPicker/ColorPicker";

export default function AppearanceTab({ locale }: { locale: any }) {
  const { settings: { appearance: settings }, updateContextSetting } = useSettings();
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
        <ColorPicker settings={settings}/>
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
