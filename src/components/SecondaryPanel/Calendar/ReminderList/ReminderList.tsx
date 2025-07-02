import type { TimeDateSettings } from "types/settings";
import type { GoogleReminder, Reminder, Day } from "types/calendar";
import { formatDate } from "services/timeDate";
import { getSetting } from "services/settings";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import "./reminder-list.css";

type Props = {
  reminders: (Reminder | GoogleReminder)[],
  locale: any,
  showReminderDay: (reminder: Reminder | GoogleReminder) => void,
  editReminder: (reminderId: string, type: string, day?: Day) => void,
  removeReminder: (reminder: Reminder) => void,
  changeReminderColor: (reminderId: string) => void,
  hide: () => void
}

export default function ReminderList({ reminders, locale, showReminderDay, editReminder, removeReminder, changeReminderColor, hide }: Props) {
  const { dateLocale } = getSetting("timeDate") as TimeDateSettings;
  const sortedReminders = reminders.filter(reminder => reminder.type === "google" ? reminder.editable : true).toSorted((a, b) => {
    const dateA = new Date(a.year, a.month, a.day).getTime();
    const dateB = new Date(b.year, b.month, b.day).getTime();

    return dateA - dateB;
  }).map(reminder => {
    reminder.dateString = formatDate(new Date(reminder.year, reminder.month, reminder.day), {
      locale: dateLocale
    });
    return reminder;
  });

  return (
    <div className="calendar full-height">
      <div className="calendar-header reminder-list-header">
        <button className="btn icon-btn" onClick={hide} title={locale.global.back}>
          <Icon id="chevron-left"/>
        </button>
        <span className="calendar-title reminder-list-title">{locale.calendar.reminders_title}</span>
      </div>
      {sortedReminders.length > 0 ? (
        <ul className="reminder-list-items" data-dropdown-parent>
          {sortedReminders.map(reminder => (
            <li className={`reminder-list-item reminder-list-item-col${reminder.removing ? " removing" : ""}`} key={reminder.id}>
              <button className="btn text-btn reminder-list-item-date" onClick={() => showReminderDay(reminder)}>{reminder.dateString}</button>
              <div className="reminder-list-item-content">
                {reminder.type === "google" ? (
                  <div className="reminder-list-item-color inert" style={{ "backgroundColor": reminder.color }}></div>
                ) : (
                  <button className="btn reminder-list-item-color" style={{ "backgroundColor": reminder.color }} title={locale.global.change_color}
                    onClick={() => changeReminderColor(reminder.id)}></button>
                )}
                <div>
                  {reminder.repeat && <Icon id="repeat" className="reminder-repeat-icon" title={reminder.repeat.tooltip}/>}
                  {reminder.type === "google" ? <Icon id="cloud" className="google-reminder-icon" title={locale.calendar.google_event}/> : ""}
                </div>
                <div>
                  <p>{reminder.text}</p>
                  {reminder.description ? <p className="reminder-list-item-description" dangerouslySetInnerHTML={{ __html: reminder.description }}></p> : null}
                  <div className="reminder-list-item-range">{reminder.range.text}</div>
                </div>
                {reminder.type === "google" && !reminder.editable ? null : (
                  <Dropdown container={{ className: "reminder-list-item-dropdown" }}>
                    <button className="btn icon-text-btn dropdown-btn"
                      onClick={() => editReminder(reminder.id, reminder.type)}>
                      <Icon id="edit"/>
                      <span>{locale.global.edit}</span>
                    </button>
                    <button className="btn icon-text-btn dropdown-btn"
                      onClick={() => removeReminder(reminder)}>
                      <Icon id="trash"/>
                      <span>{locale.global.remove}</span>
                    </button>
                  </Dropdown>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="empty-reminder-list-message">{locale.calendar.no_reminders_message}</p>}
    </div>
  );
}
