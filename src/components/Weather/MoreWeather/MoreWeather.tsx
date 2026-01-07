import type { Current, More } from "types/weather";
import { handleMoveInit } from "services/widgetStates";
import Icon from "components/Icon";
import Spinner from "components/Spinner";
import "./more-weather.css";
import SettingsDropdown from "./SettingsDropdown/SettingsDropdown";
import CurrentView from "./CurrentView/CurrentView";
import HourlyView from "./HourlyView/HourlyView";
import DailyTemp from "./DailyTemp/DailyTemp";

type Props = {
  current: Current,
  more: More | null,
  units: "C" | "F",
  speedUnits: "m/s" | "ft/s",
  message?: string,
  updating?: boolean,
  locale: any,
  hide: () => void
}

export default function MoreWeather({ current, more, units, speedUnits, message, updating, locale, hide }: Props) {
  return (
    <>
      <div className="container-header weather-more-current">
        <div className="weather-more-top" data-move-id="weather" onPointerDown={handleMoveInit}>
          {updating ? (
            <div className="weather-more-update-indicator">
              <Spinner size="20px"/>
              <span>{locale.global.updating}</span>
            </div>
          ) : null}
          <SettingsDropdown locale={locale}/>
          <button className="btn icon-btn weather-more-close-btn" onClick={hide} title={locale.global.close}>
            <Icon id="cross"/>
          </button>
        </div>
        <CurrentView current={current} units={units} speedUnits={speedUnits} locale={locale}/>
      </div>
      {more ? (
        <>
          <HourlyView locale={locale} hourly={more.hourly} speedUnits={speedUnits} updating={updating}/>
          <DailyTemp daily={more.daily} updating={updating}/>
        </>
      ) : message ? <p className="weather-more-message">{message}</p>
        : <Spinner size="48px"/>
      }
    </>
  );
}
