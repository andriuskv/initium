import { getLocalStorageItem } from "utils";
import type { TimeDateSettings } from "types/settings";
import type { Announcement } from "types/announcement";
import { formatDate } from "services/timeDate";
import { getSetting } from "services/settings";
import "./logs.css";

export default function LogsTab() {
  const announcements: Announcement[] = (getLocalStorageItem("announcements") || []);
  const { dateLocale } = getSetting("timeDate") as TimeDateSettings;

  return (
    <div className="container-body setting-tab">
      <ul>
        {announcements.map(message => (
          <li className="logs-item" key={message.date}>
            <div className="logs-item-header">
              {message.type ? <div>{message.type}</div> : null}
              <div>{formatDate(message.date, { locale: dateLocale, includeTime: true })}</div>
            </div>
            <div className="logs-item-body">
            </div>
            {message.title ? <div className="logs-item-title">{message.title}</div> : null}
            <p>{message.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
