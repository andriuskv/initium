import { useState, useRef } from "react";
import { timeout } from "utils";
import { updateSetting } from "services/settings";
import Icon from "components/Icon";
import "./ColorPicker.css";
import type { AppearanceSettings } from "types/settings";

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

export default function ColorPicker({ settings }: { settings: AppearanceSettings }) {
  const [colorIndex, setColorIndex] = useState(() => {
    return colors.findIndex(color => settings.accentColor.hue === color.hue && settings.accentColor.saturation === color.saturation);
  });
  const timeoutId = useRef(0);

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
  );
}
