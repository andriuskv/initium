import { formatDate } from "services/timeDate";
import { getSetting } from "services/settings";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import "./reminder-list.css";

export default function ReminderList({ reminders, locale, showForm, removeReminder, changeReminderColor, hide }) {
  const { dateLocale } = getSetting("timeDate");
  const sortedReminders = reminders.toSorted((a, b) => {
    return new Date(a.year, a.month, a.day) - new Date(b.year, b.month, b.day);
  }).map(reminder => {
    reminder.dateString = formatDate(new Date(reminder.year, reminder.month, reminder.day), {
      locale: dateLocale
    });
    return reminder;
  });

  function editReminder(id) {
    const reminder = reminders.find(reminder => reminder.id === id);

    showForm({
      ...reminder,
      updating: true
    });
  }

  return (
    <div className="calendar full-height">
      <div className="calendar-header reminder-list-header">
        <button className="btn icon-btn" onClick={hide} title={locale.global.back}>
          <Icon id="chevron-left"/>
        </button>
        <span className="calendar-title reminder-list-title">Reminders</span>
      </div>
      {sortedReminders.length > 0 ? (
        <ul className="remainder-list-items" data-dropdown-parent>
          {sortedReminders.map(reminder => (
            <li key={reminder.id}>
              <div className="remainder-list-item-date">{reminder.dateString}</div>
              <div className="remainder-list-item">
                {reminder.type === "google" ? (
                  <div className="remainder-list-item-color inert" style={{ "backgroundColor": reminder.color }}></div>
                ) : (
                  <button className="btn remainder-list-item-color" style={{ "backgroundColor": reminder.color }} title="Change color"
                    onClick={() => changeReminderColor(reminder.id)}></button>
                )}
                <div>
                  {reminder.repeat && <Icon id="repeat" className="reminder-repeat-icon" title={reminder.repeat.tooltip}/>}
                  {reminder.type === "google" ? <Icon id="cloud" className="google-reminder-icon" title="Google Calendar event"/> : ""}
                </div>
                <div>
                  <p>{reminder.text}</p>
                  <div className="remainder-list-item-range">{reminder.range.text}</div>
                </div>
                {reminder.type === "google" && !reminder.editable ? null : (
                  <Dropdown container={{ className: "remainder-list-item-dropdown" }}>
                    {reminder.type === "google" ? null : (
                      <button className="btn icon-text-btn dropdown-btn"
                        onClick={() => editReminder(reminder.id)}>
                        <Icon id="edit"/>
                        <span>{locale.global.edit}</span>
                      </button>
                    )}
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
