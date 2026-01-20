import { getLocalStorageItem } from "utils";
import type { TimeDateSettings } from "types/settings";
import type { Announcement } from "types/announcement";
import { formatDate } from "services/timeDate";
import { getSetting } from "services/settings";
import "./logs.css";

function Entry({ message, locale }: { message: Announcement, locale: any }) {
  const { dateLocale } = getSetting("timeDate") as TimeDateSettings;
  const title = message.titleId ? locale.notification[message.titleId] : message.title;
  const content = message.contentId ? locale.notification[message.contentId] : message.content;

  return (
    <li className="logs-item" key={message.date}>
      <div className="logs-item-header">
        {message.type ? <div>{message.type}</div> : null}
        <div>{formatDate(message.date, { locale: dateLocale, includeTime: true })}</div>
      </div>
      <div className="logs-item-body">
      </div>
      {title ? <div className="logs-item-title">{title}</div> : null}
      <p>{content}</p>
    </li>
  );
}

export default function LogsTab({ locale }: { locale: any }) {
  const announcements: Announcement[] = (getLocalStorageItem("announcements") || []);

  return (
    <div className="container-body setting-tab">
      <ul>
        {announcements.map(message => <Entry message={message} locale={locale} key={message.date} />)}
      </ul>
    </div>
  );
}
