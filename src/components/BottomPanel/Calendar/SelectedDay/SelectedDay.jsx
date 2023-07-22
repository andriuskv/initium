import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { getRandomHslColor } from "utils";
import * as chromeStorage from "services/chromeStorage";
import { getDate, padTime } from "services/timeDate";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import "./selected-day.css";

const Form = lazy(() => import("./Form"));

export default function SelectedDay({ selectedDay, calendar, reminders, updateCalendar, createReminder, resetSelectedDay, hide }) {
  const [day, setDay] = useState(null);
  const [form, setForm] = useState(null);
  const timeoutId = useRef(0);

  useEffect(() => {
    const { year, month, day } = selectedDay;

    setDay({
      ...calendar[year][month].days[day - 1],
      dateString: getDate("month day, year", selectedDay)
    });
  }, [selectedDay]);

  function changeReminderColor(reminder) {
    const color = getRandomHslColor();
    const r = reminders.find(({ id }) => reminder.id === id);

    r.color = color;
    reminder.color = color;

    updateCalendar();

    clearTimeout(timeoutId.current);
    timeoutId.current = setTimeout(() => {
      saveReminders(reminders);
    }, 1000);
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
    setForm(form);
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

  function backToCalendar() {
    if (form) {
      setForm(null);
    }
    else {
      hide();
    }
  }

  function showForm() {
    setForm({});
  }

  function updateReminder(reminder, form) {
    createReminder(reminder, calendar, form.updating);

    if (form.updating) {
      reminders.splice(form.reminderIndex, 1, reminder);

      if (form.repeat.wasEnabled) {
        removeRepeatedReminder(form.id);
      }
      resetSelectedDay();
    }
    else {
      reminders.push(reminder);
    }
    setForm(null);
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
    return <div className="calendar"></div>;
  }
  return (
    <div className="calendar">
      <div className="calendar-header selected-day-header">
        <button className="btn icon-btn" onClick={backToCalendar} title="Back to calendar">
          <Icon id="chevron-left"/>
        </button>
        <span className="selected-day-title">{day.dateString}</span>
      </div>
      {form ? (
        <Suspense fallback={null}>
          <Form form={form} day={day} updateReminder={updateReminder} hide={backToCalendar}/>
        </Suspense>
      ) : (
        <>
          {day.reminders.length > 0 ? (
            <ul className="selected-day-remainders" data-dropdown-parent>
              {day.reminders.map((reminder, index) => (
                <li className="selected-day-remainder" key={reminder.id}>
                  <div className="selected-day-reminder-color" style={{ "backgroundColor": reminder.color }}
                    onClick={() => changeReminderColor(reminder)}></div>
                  {reminder.repeat && <Icon id="repeat" className="reminder-repeat-icon" title={reminder.repeat.tooltip}/>}
                  <div>
                    <div>{reminder.text}</div>
                    <div className="selected-day-reminder-range">{reminder.range.text}</div>
                  </div>
                  <Dropdown container={{ className: "selected-day-remainder-dropdown" }}>
                    <button className="btn icon-text-btn dropdown-btn"
                      onClick={() => editReminder(reminder.id, index)}>
                      <Icon id="edit"/>
                      <span>Edit</span>
                    </button>
                    <button className="btn icon-text-btn dropdown-btn"
                      onClick={() => removeReminder(reminder.id, index)}>
                      <Icon id="trash"/>
                      <span>Remove</span>
                    </button>
                  </Dropdown>
                </li>
              ))}
            </ul>
          ) : <p className="empty-reminder-list-message">No reminders</p>}
          <button className="btn icon-text-btn create-btn" onClick={showForm}>
            <Icon id="plus"/>
            <span>Create</span>
          </button>
        </>
      )}
    </div>
  );
}
