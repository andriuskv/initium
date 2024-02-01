import { useState, useEffect, useRef, lazy } from "react";
import { dispatchCustomEvent, getRandomHslColor, timeout } from "utils";
import * as chromeStorage from "services/chromeStorage";
import { padTime } from "services/timeDate";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import CreateButton from "components/CreateButton";
import "./selected-day.css";

const Form = lazy(() => import("./Form"));

export default function SelectedDay({ selectedDay, calendar, reminders, locale, updateCalendar, sortDayReminders, createReminder, resetSelectedDay, hide }) {
  const [day, setDay] = useState(null);
  const timeoutId = useRef(0);

  useEffect(() => {
    const { year, month, day } = selectedDay;

    setDay({ ...calendar[year][month].days[day - 1] });
  }, [selectedDay]);

  function changeReminderColor(reminder) {
    const color = getRandomHslColor();
    const r = reminders.find(({ id }) => reminder.id === id);

    r.color = color;
    reminder.color = color;

    updateCalendar();

    timeoutId.current = timeout(() => {
      saveReminders(reminders);
    }, 1000, timeoutId.current);
  }

  function filterReminders(reminders, id) {
    return reminders.filter(reminder => reminder.id !== id);
  }

  function removeRepeatedReminder(id) {
    Object.keys(calendar).forEach(year => {
      calendar[year].forEach(month => {
        month.days.forEach(day => {
          if (day.reminders.length) {
            day.reminders = filterReminders(day.reminders, id);
          }
        });
      });
    });
  }

  function editReminder(id, i) {
    const index = reminders.findIndex(reminder => reminder.id === id);
    const reminder = reminders[index];

    const form = {
      ...reminder,
      updating: true,
      reminderIndex: index,
      reminderDayIndex: i
    };

    if (reminder.range) {
      form.range.enabled = reminder.range.text !== "All day";

      if (reminder.range.from) {
        form.range.from = { text: `${reminder.range.from.hours}:${padTime(reminder.range.from.minutes)}`};
      }

      if (reminder.range.to) {
        form.range.to = { text: `${reminder.range.to.hours}:${padTime(reminder.range.to.minutes)}`};
      }
    }

    if (reminder.repeat) {
      form.repeat = {
        ...form.repeat,
        wasEnabled: true,
        enabled: true,
        type: reminder.repeat.type || "custom",
        ends: reminder.repeat.count > 0 ? "occurrences" : "never",
        gap: reminder.repeat.gap,
        count: reminder.repeat.count,
        year: reminder.year,
        month: reminder.month,
        day: reminder.day
      };

      if (reminder.repeat.type === "weekday") {
        form.repeat.weekdays = { static: [...reminder.repeat.weekdays.dynamic] };
        form.repeat.weekdays.static[form.repeat.currentWeekday] = true;
      }
    }
    showForm(form);
  }

  function removeReminder(id, i) {
    const index = reminders.findIndex(reminder => reminder.id === id);

    day.reminders.splice(i, 1);
    reminders.splice(index, 1);

    setDay({ ...day });
    removeRepeatedReminder(id);
    updateCalendar();
    saveReminders(reminders);
  }

  function showForm(form = {}) {
    dispatchCustomEvent("fullscreen-modal", {
      id: "reminder",
      shouldToggle: true,
      component: Form,
      params: { form, day, locale, updateReminder }
    });
  }

  function updateReminder(reminder, form) {
    createReminder(reminder, calendar, form.updating);
    sortDayReminders(selectedDay);

    if (form.updating) {
      reminders.splice(form.reminderIndex, 1, reminder);

      if (form.repeat.wasEnabled) {
        removeRepeatedReminder(form.id);
      }
    }
    else {
      reminders.push(reminder);
    }
    resetSelectedDay();
    saveReminders(reminders);
  }

  async function saveReminders(reminders) {
    chromeStorage.set({ reminders: structuredClone(reminders).map(reminder => {
      if (!reminder.range.from) {
        delete reminder.range;
      }

      if (reminder.repeat) {
        delete reminder.repeat.tooltip;

        if (reminder.repeat.type === "weekday") {
          delete reminder.repeat.weekdays.dynamic;
        }
      }

      return {
        creationDate: reminder.creationDate,
        day: reminder.day,
        month: reminder.month,
        year: reminder.year,
        range: reminder.range,
        repeat: reminder.repeat,
        color: reminder.color,
        text: reminder.text
      };
    })});
  }

  if (!day) {
    return <div className="calendar day-selected"></div>;
  }
  return (
    <div className="calendar day-selected">
      <div className="calendar-header selected-day-header">
        <button className="btn icon-btn" onClick={hide} title={locale.global.back}>
          <Icon id="chevron-left"/>
        </button>
        <span className="calendar-title selected-day-title">{day.dateString}</span>
      </div>
      {day.reminders.length > 0 ? (
        <ul className="selected-day-remainders" data-dropdown-parent>
          {day.reminders.map((reminder, index) => (
            <li className="selected-day-remainder" key={reminder.id}>
              {reminder.type === "google" ? (
                <div className="selected-day-reminder-color inert" style={{ "backgroundColor": reminder.color }}></div>
              ) : (
                <button className="btn selected-day-reminder-color" style={{ "backgroundColor": reminder.color }} title="Change color"
                  onClick={() => changeReminderColor(reminder)}></button>
              )}
              <div>
                {reminder.repeat && <Icon id="repeat" className="reminder-repeat-icon" title={reminder.repeat.tooltip}/>}
                {reminder.type === "google" ? <Icon id="cloud" className="google-reminder-icon" title="Google Calendar event"/> : ""}
              </div>
              <div>
                <div>{reminder.text}</div>
                <div className="selected-day-reminder-range">{reminder.range.text}</div>
              </div>
              {reminder.type === "google" ? null : (
                <Dropdown container={{ className: "selected-day-remainder-dropdown" }}>
                  <button className="btn icon-text-btn dropdown-btn"
                    onClick={() => editReminder(reminder.id, index)}>
                    <Icon id="edit"/>
                    <span>{locale.global.edit}</span>
                  </button>
                  <button className="btn icon-text-btn dropdown-btn"
                    onClick={() => removeReminder(reminder.id, index)}>
                    <Icon id="trash"/>
                    <span>{locale.global.remove}</span>
                  </button>
                </Dropdown>
              )}
            </li>
          ))}
        </ul>
      ) : <p className="empty-reminder-list-message">{locale.calendar.no_reminders_message}</p>}
      <CreateButton onClick={() => showForm()} attrs={{ "data-modal-initiator": true }} shiftTarget=".icon-btn" trackScroll></CreateButton>
    </div>
  );
}
