import type { Hour } from "types/weather";

type Props = {
  hourly: Hour[]
}

export default function PrecView({ hourly }: Props) {
  return (
    <div className="weather-more-hourly-view">
      <div className="weather-more-hourly-prec-view-values">
        {hourly.filter((_, index) => index % 3 === 1).map(item => (
          <div className="weather-more-hourly-prec-view-value" key={item.id}>{item.precipitation}%</div>
        ))}
      </div>
      <div className="weather-more-hourly-prec-view-graph">
        {hourly.slice(0, -1).map(item => (
          <div className="weather-more-hourly-prec-view-graph-bar" key={item.id} style={{ height: `${item.precipitation}%` }} data-testid="bar"></div>
        ))}
      </div>
    </div>
  );
}
