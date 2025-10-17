import { type CSSProperties } from "react";
import type { Stats } from "../StorageTab.type";
import { parseLocaleString } from "utils";
import "./MainUsage.css";

export default function MainUsage({ locale, stats }: { locale: any, stats: Stats }) {
  const usedGroup = parseLocaleString(locale.settings.storage.usage_label_1, (
    <div className="storage-usage-current-numerical" key={stats.usedStorageFormatted}>
      <span>{stats.usedStorageFormatted}</span>
      <span className="storage-usage-current-numerical-units">kB</span>
    </div>
  ), <div key={stats.maxStorageFormatted}>{parseLocaleString(locale.settings.storage.usage_label_2, stats.maxStorageFormatted)}</div>,
  locale.settings.storage.usage_label_3);

  return (
    <div className="storage-usage">
      <div className="storage-usage-numerical">
        {usedGroup}
      </div>
      <div className="storage-usage-percental">
        <svg viewBox="0 0 100 100" className="storage-usage-visual">
          <circle cx="50" cy="50" r="45"/>
          <circle cx="50" cy="50" r="45" strokeDasharray="1000"
            className={`storage-usage-current-visual${stats.dashoffset < 745.3 ? " full" : ""}`}
            style={{ "--dashoffset": stats.dashoffset } as CSSProperties}/>
        </svg>
        <div className="storage-usage-current-percental">{stats.usedStorageInPercent}%</div>
        <div>{locale.settings.storage.used_label}</div>
      </div>
    </div>
  );
}
