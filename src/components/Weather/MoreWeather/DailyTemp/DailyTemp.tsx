import type { Weekday } from "types/weather";
import "./DailyTemp.css";

type Props = {
  daily: Weekday[],
}

export default function DailyTemp({ daily }: Props) {
  return (
    <div className="container-footer weather-more-daily">
      {daily.map(item => (
        <div className="weather-more-daily-weekday" key={item.id}>
          <div className="weather-more-daily-weekday-name">{item.weekday}</div>
          <img src={`/assets/weather-icons/${item.iconId}.png`} alt={item.description} title={item.description} className={`weather-more-daily-weekday-icon icon-${item.iconId}`} width="56px" height="56px" loading="lazy" />
          <div className="weather-more-daily-weekday-temp">
            <div>{Math.round(item.temperature.min)}°</div>
            <div>{Math.round(item.temperature.max)}°</div>
          </div>
        </div>
      ))}
    </div>
  );
}
