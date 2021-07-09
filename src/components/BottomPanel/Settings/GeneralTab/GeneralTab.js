import { useRef } from "react";
import { dispatchCustomEvent } from "utils";
import { useSettings } from "contexts/settings-context";
import { updateSetting } from "services/settings";

export default function GeneralTab() {
  const { settings: { general: settings }, toggleSetting } = useSettings();
  const timeoutId = useRef(0);

  function handleRangeInputChange({ target }) {
    const { name, value } = target;

    if (name === "backgroundOpacity") {
      document.body.style.setProperty("--background-opacity", `${value}%`);
    }
    else if (name === "backgroundBlurRadius") {
      document.body.style.setProperty("--background-blur", `${value}px`);
    }
    clearTimeout(timeoutId.current);
    timeoutId.current = setTimeout(() => {
      updateSetting({ general: { [name]: Number(value) } });
    }, 1000);
  }

  function showGreetingEditor() {
    dispatchCustomEvent("greeting-editor-visible");
  }

  return (
    <div className="setting-tab" onChange={handleRangeInputChange}>
      <label className="setting">
        <span>Background opacity</span>
        <input type="range" className="range-input" min="0" max="100" step="5"
          defaultValue={settings.backgroundOpacity} name="backgroundOpacity"/>
      </label>
      <label className="setting">
        <span>Background blur radius</span>
        <input type="range" className="range-input" min="0" max="24" step="1"
          defaultValue={settings.backgroundBlurRadius} name="backgroundBlurRadius"/>
      </label>
      <label className="setting">
        <span>Disable greeting</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.greetingDisabled}
          onChange={() => toggleSetting("general", "greetingDisabled")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <div className="setting">
        <button className="btn" onClick={showGreetingEditor} disabled={settings.greetingDisabled}>Set a greeting</button>
      </div>
    </div>
  );
}
