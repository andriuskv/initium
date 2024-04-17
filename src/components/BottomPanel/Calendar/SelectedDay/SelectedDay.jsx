import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import CreateButton from "components/CreateButton";

export default function SelectedDay({ day, reminders, locale, removeReminder, changeReminderColor, showForm, hide }) {
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
        <span className="calendar-title reminder-list-title">{day.dateString}</span>
      </div>
      {day.reminders.length > 0 ? (
        <ul className="reminder-list-items" data-dropdown-parent>
          {day.reminders.map(reminder => (
            <li className="reminder-list-item" key={reminder.id}>
              {reminder.type === "google" ? (
                <div className="reminder-list-item-color inert" style={{ "backgroundColor": reminder.color }}></div>
              ) : (
                <button className="btn reminder-list-item-color" style={{ "backgroundColor": reminder.color }} title="Change color"
                  onClick={() => changeReminderColor(reminder.id)}></button>
              )}
              <div>
                {reminder.repeat && <Icon id="repeat" className="reminder-repeat-icon" title={reminder.repeat.tooltip}/>}
                {reminder.type === "google" ? <Icon id="cloud" className="google-reminder-icon" title="Google Calendar event"/> : ""}
              </div>
              <div>
                <div>{reminder.text}</div>
                <div className="reminder-list-item-range">{reminder.range.text}</div>
              </div>
              {reminder.type === "google" && !reminder.editable ? null : (
                <Dropdown container={{ className: "reminder-list-item-dropdown" }}>
                  {reminder.type === "google" ? null : (
                    <button className="btn icon-text-btn dropdown-btn"
                      onClick={() => editReminder(reminder.id)}>
                      <Icon id="edit"/>
                      <span>{locale.global.edit}</span>
                    </button>
                  )}
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
      <CreateButton onClick={() => showForm(day)} attrs={{ "data-modal-initiator": true }} shiftTarget=".icon-btn" trackScroll></CreateButton>
    </div>
  );
}
