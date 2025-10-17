import type { Current, Hour, Weekday } from "types/weather";
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
  more: { hourly: Hour[], daily: Weekday[] } | null,
  units: "C" | "F",
  speedUnits: "m/s" | "ft/s",
  message?: string,
  locale: any,
  hide: () => void
}

export default function MoreWeather({ current, more, units, speedUnits, message, locale, hide }: Props) {
  return (
    <>
      <div className="container-header weather-more-current">
        <div className="weather-more-top" data-move-id="weather" onPointerDown={handleMoveInit}>
          <SettingsDropdown locale={locale}/>
          <button className="btn icon-btn weather-more-close-btn" onClick={hide} title={locale.global.close}>
            <Icon id="cross"/>
          </button>
        </div>
        <CurrentView current={current} units={units} speedUnits={speedUnits} locale={locale}/>
      </div>
      {more ? (
        <>
          <HourlyView locale={locale} hourly={more.hourly} speedUnits={speedUnits}/>
          <DailyTemp daily={more.daily}/>
        </>
      ) : message ? <p className="weather-more-message">{message}</p>
        : <Spinner size="48px"/>
      }
    </>
  );
}
