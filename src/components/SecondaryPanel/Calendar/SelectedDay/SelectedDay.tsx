import type { Reminder, Day } from "types/calendar";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import CreateButton from "components/CreateButton";

type Props = {
  day: Day,
  locale: any,
  removeReminder: (reminder: Reminder, day: Day) => void,
  changeReminderColor: (reminderId: string) => void,
  editReminder: (reminderId: string, type: string, day?: Day) => void,
  showForm: (day: Day) => void,
  hide: () => void,
}

export default function SelectedDay({ day, locale, removeReminder, changeReminderColor, editReminder, showForm, hide }: Props) {
  return (
    <div className="calendar full-height">
      <div className="calendar-header reminder-list-header">
        <button className="btn icon-btn" onClick={hide} title={locale.global.back}>
          <Icon id="chevron-left"/>
        </button>
        <span className="calendar-title reminder-list-title">{day.dateString}</span>
      </div>
      {day.reminders.length > 0 ? (
        <ul className="reminder-list-items" data-dropdown-parent>
          {day.reminders.map(reminder => (
            <li className={`reminder-list-item${reminder.removing ? " removing" : ""}`} key={reminder.id}>
              {reminder.type === "google" ? (
                <div className="reminder-list-item-color inert" style={{ "backgroundColor": reminder.color }}></div>
              ) : (
                <button className="btn reminder-list-item-color" style={{ "backgroundColor": reminder.color }} title="Change color"
                  onClick={() => changeReminderColor(reminder.id)}></button>
              )}
              <div>
                {reminder.repeat && <Icon id="repeat" className="reminder-repeat-icon" title={reminder.repeat.tooltip}/>}
                {reminder.type === "google" ? <Icon id="cloud" className="google-reminder-icon" title="Google calendar event"/> : ""}
              </div>
              <div>
                <p>{reminder.text}</p>
                {reminder.description ? <p className="reminder-list-item-description">{reminder.description}</p> : null}
                <div className="reminder-list-item-range">{reminder.range.text}</div>
              </div>
              {reminder.type === "google" && !reminder.editable ? null : (
                <Dropdown container={{ className: "reminder-list-item-dropdown" }}>
                  <button className="btn icon-text-btn dropdown-btn"
                    onClick={() => editReminder(reminder.id, reminder.type, day)}>
                    <Icon id="edit"/>
                    <span>{locale.global.edit}</span>
                  </button>
                  <button className="btn icon-text-btn dropdown-btn"
                    onClick={() => removeReminder(reminder, day)}>
                    <Icon id="trash"/>
                    <span>{locale.global.remove}</span>
                  </button>
                </Dropdown>
              )}
            </li>
          ))}
        </ul>
      ) : <p className="empty-reminder-list-message">{locale.calendar.no_reminders_message}</p>}
      <CreateButton onClick={() => showForm(day)} attrs={{ "data-modal-initiator": "" }} shiftTarget=".icon-btn" trackScroll/>
    </div>
  );
}
