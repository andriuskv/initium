import type { Hour } from "types/weather";

type Props = {
  hourly: Hour[]
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

export default function TempView({ hourly }: Props) {
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
