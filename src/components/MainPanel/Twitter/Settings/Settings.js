import { useState } from "react";
import Icon from "components/Icon";
import "./settings.css";

export default function Settings({ defaultColor, updateHighlightColor, close }) {
  const colors = [
    "#1d9bf0",
    "#ffd400",
    "#f91880",
    "#7856ff",
    "#ff7a00",
    "#00ba7c",
    defaultColor
  ];
  const [selectedColor, setSelectedColor] = useState(() => {
    const savedColor = localStorage.getItem("twitter-highlight-color");
    const color = colors.find(color => color === savedColor) || colors.at(-1);

    return color;
  });

  function selectColor(color) {
    setSelectedColor(color);
    updateHighlightColor(color);
    localStorage.setItem("twitter-highlight-color", color);
  }

  return (
    <div className="container twitter-settings">
      <div className="twitter-settings-header">
        <h3 className="twitter-settings-title">Settings</h3>
        <button className="btn icon-btn" onClick={close} title="Close">
          <Icon id="cross"/>
        </button>
      </div>
      <div className="twitter-settings-section">
        <h4 className="twitter-settings-section-title">Highlight color</h4>
        <ul className="twitter-settings-colors">
          {colors.map((color, index) => (
            <li key={index}>
              <button className="btn icon-btn twitter-settings-color-btn"
                onClick={() => selectColor(color)} style={{ backgroundColor: color }}>
                {selectedColor === color ? <Icon id="check"/> : null}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
