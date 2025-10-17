import { useSettings } from "contexts/settings";
import Dropdown from "components/Dropdown";

type Props = {
  locale: any
}

export default function SettingsDropdown({ locale }: Props) {
  const { settings, updateContextSetting } = useSettings();
  const { units, speedUnits } = settings.weather;

  function toggleUnits(type: "temp" | "wind") {
    if (type === "temp") {
      updateContextSetting("weather", { units: units === "C" ? "F" : "C" });
    }
    else if (type === "wind") {
      updateContextSetting("weather", { speedUnits: speedUnits === "m/s" ? "ft/s" : "m/s" });
    }
  }

  return (
    <Dropdown container={{ className: "weather-more-settings" }} toggle={{ iconId: "settings", title: locale.global.settings }}>
      <label className="dropdown-group weather-more-setting">
        <div>{locale.weather.temp_setting_label}</div>
        <input type="checkbox" className="sr-only toggle-input"
          checked={units === "F"}
          onChange={() => toggleUnits("temp")}/>
        <div className="toggle">
          <div className="toggle-item">°C</div>
          <div className="toggle-item">°F</div>
        </div>
      </label>
      <label className="dropdown-group weather-more-setting">
        <div>{locale.weather.wind_setting_label}</div>
        <input type="checkbox" className="sr-only toggle-input"
          checked={speedUnits === "ft/s"}
          onChange={() => toggleUnits("wind")}/>
        <div className="toggle">
          <div className="toggle-item">m/s</div>
          <div className="toggle-item">ft/s</div>
        </div>
      </label>
    </Dropdown>
  );
}
