import { type CSSProperties } from "react";
import type { Hour } from "types/weather";

type Props = {
  hourly: Hour[],
  speedUnits: "m/s" | "ft/s",
}

export default function WindView({ hourly, speedUnits }: Props) {
  const items = hourly.filter((_, index) => index % 3 === 1);
  const [minSpeed, maxSpeed] = items.reduce(([minSpeed, maxSpeed], item) => {
    if (item.wind.speed.raw > maxSpeed) {
      maxSpeed = item.wind.speed.raw;
    }

    if (item.wind.speed.raw < minSpeed) {
      minSpeed = item.wind.speed.raw;
    }
    return [minSpeed, maxSpeed];
  }, [Infinity, -Infinity]);

  return (
    <div className="weather-more-hourly-view weather-more-hourly-wind-view">
      {items.map(({ id, wind }) => {
        let ratio = 1;

        if (minSpeed !== maxSpeed) {
          ratio = (wind.speed.raw - minSpeed) / (maxSpeed - minSpeed);
        }
        return (
          <div className="weather-more-hourly-wind-view-item" key={id}>
            <div className="weather-more-hourly-wind-view-item-speed">{wind.speed.value} {speedUnits}</div>
            <svg viewBox="0 0 24 24" className="weather-more-hourly-wind-view-item-icon"
              style={{ "--degrees": wind.direction.degrees, "--ratio": ratio } as CSSProperties}>
              <title>{wind.direction.name}</title>
              <use href="#arrow-up"></use>
            </svg>
          </div>
        );
      })}
    </div>
  );
}
