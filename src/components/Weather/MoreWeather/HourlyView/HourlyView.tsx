import { type CSSProperties } from "react";
import type { Hour, View } from "types/weather";

type Props = {
  view: View,
  hourly: Hour[],
  units: "C" | "F",
  speedUnits: "m/s" | "ft/s",
}

function getTempRange(hourly: Hour[]) {
  const tempRange = hourly.reduce((range, item) => {
    const temp = item.tempC;

    if (temp < range.min) {
      range.min = temp;
    }

    if (temp > range.max) {
      range.max = temp;
    }
    return range;
  }, { min: Infinity, max: -Infinity });

  return {
    min: tempRange.min - 2,
    max: tempRange.max + 1
  };
}

export default function HourlyView({ view, hourly, speedUnits }: Props) {
  function getSvgY(current: number, offset = 0) {
    const tempRange = getTempRange(hourly);
    const maxRange = tempRange.max - tempRange.min;
    const range = current - tempRange.min;

    return (100 - (range / maxRange * 100 * 0.6) - offset).toFixed(2);
  }

  function getTempPath(closePath = false) {
    let path = "";
    let offset = 0;

    for (const [index, item] of Object.entries(hourly)) {
      const y = getSvgY(item.tempC);
      const numIndex = Number(index);

      // 576 = container width; 24 = item count
      // 24 = 576 / 24
      path += ` L${numIndex * 24 + offset} ${y}`;

      if (offset === 0) {
        offset = 12;
      }
      else if (numIndex + 2 === hourly.length) {
        offset = 0;
      }
    }

    if (closePath) {
      return `M${path.slice(2)} L576 100 L0 100 Z`;
    }
    return `M${path.slice(2)}`;
  }

  if (view === "temp") {
    const values = hourly.map((item, index) => {
      const x = `calc(${index * 24 + 12}px - ${Math.round(item.temperature).toString().length / 2}ch)`;
      const y = `calc(${getSvgY(item.tempC, 6)}px - 0.5ch)`;

      if (index % 3 === 1) {
        return <text className="weather-more-hourly-temp-view-text" style={{ transform: `translate(${x}, ${y})` }}
          key={item.id}>{Math.round(item.temperature)}°</text>;
      }
      return null;
    });

    return (
      <svg className="weather-more-hourly-view weather-more-hourly-temp-view">
        {values}
        <path fill="none" stroke="var(--color-primary)" strokeWidth="2px" d={getTempPath()}></path>
        <path fill="var(--color-primary-0-40)" d={getTempPath(true)}></path>
      </svg>
    );
  }
  else if (view === "prec") {
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
  else if (view === "wind") {
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
  return null;
}
