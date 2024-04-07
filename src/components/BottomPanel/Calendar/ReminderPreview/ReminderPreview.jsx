import Icon from "components/Icon";
import "./reminder-preview.css";

export default function ReminderPreview({ currentView, currentDay, tomorrowDay, settings, ref }) {
  const days = [
    {
      shouldShow: !settings.reminderPreviewHidden,
      name: "Today",
      reminders: currentDay.reminders
    },
    {
      shouldShow: settings.showTomorrowReminers,
      name: "Tomorrow",
      reminders: tomorrowDay.reminders
    }
  ];

  return (
    <div className={`container-body calendar-reminder-preview${currentView === "day" ? " hidden" : ""}`} ref={ref}>
      <div className="calendar-reminder-preview-content">
        {days.map(day => {
          return day.shouldShow && day.reminders.length ? (
            <div key={day.name}>
              <h4 className="calendar-reminder-preview-title">{day.name}</h4>
              <ul className="calendar-reminder-preview-items">
                {day.reminders.map(reminder => (
                  <li className="calendar-reminder-preview-item" key={reminder.id}>
                    <div className="calendar-reminder-preview-item-color" style={{ backgroundColor: reminder.color }}></div>
                    <p>{reminder.text}</p>
                    {reminder.range.from ? <p className="calendar-reminder-preview-item-range-text">{reminder.range.text}</p> : null}
                    {reminder.type === "google" ? <Icon id="cloud" className="google-reminder-icon" title="Google Calendar event"/> : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}
