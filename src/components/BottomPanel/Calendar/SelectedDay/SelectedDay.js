import { useState, useEffect, useRef } from "react";
import { getRandomHslColor } from "utils";
import * as chromeStorage from "services/chromeStorage";
import * as timeDateService from "services/timeDate";
import Icon from "components/Icon";
import "./selected-day.css";

export default function SelectedDay({ selectedDay, calendar, reminders, updateCalendar, createReminder, hide }) {
  const [day, setDay] = useState(null);
  const [form, setForm] = useState(null);
  const timeoutId = useRef(0);
  const ignoreFirstClick = useRef(true);

  useEffect(() => {
    const { year, month, day } = selectedDay;

    setDay({
      ...calendar[year][month].days[day - 1],
      dateString: timeDateService.getDate("month day, year", selectedDay)
    });

    if (selectedDay.formVisible) {
      showForm();
    }
  }, [selectedDay]);

  useEffect(() => {
    if (!form) {
      return;
    }

    if (form.range.dataList.visible) {
      window.addEventListener("click", selectDataItem);
    }
    else {
      window.removeEventListener("click", selectDataItem);
    }
    return () => {
      window.removeEventListener("click", selectDataItem);
    };
  }, [form]);

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
    setForm({
      range: {
        enabled: false,
        dataList: generateTimeTable(),
        from: { text: "" },
        to: { text: "" }
      },
      repeat: {
        enabled: false,
        ends: "never",
        gap: "",
        count: ""
      }
    });
  }

  function toggleFormCheckbox(event) {
    form[event.target.name].enabled = !form[event.target.name].enabled;
    setForm({ ...form });
  }

  function parseTimeString(string) {
    if (!string || !validateHourFormat(string)) {
      return;
    }
    const [hourString, minuteString] = string.toLowerCase().split(":");
    let hours = parseInt(hourString, 10);

    if (minuteString.endsWith("am") && hours === 12) {
      hours = 0;
    }
    else if (minuteString.endsWith("pm") && hours < 12) {
      hours += 12;
    }

    return {
      hours,
      minutes: parseInt(minuteString, 10)
    };
  }

  function handleFormSubmit(event) {
    event.preventDefault();

    const reminder = {
      text: event.target.elements.reminder.value,
      color: getRandomHslColor(),
      year: day.year,
      month: day.month,
      day: day.day
    };

    if (form.range.enabled) {
      const from = parseTimeString(form.range.from.text);
      const to = parseTimeString(form.range.to.text);

      reminder.range = {};

      if (to) {
        if (!from || to.hours < from.hours || (to.hours === from.hours && to.minutes <= from.minutes)) {
          form.range.message = "Please provide valid range.";
          setForm({ ...form });
          return;
        }
        delete to.text;
        reminder.range.to = to;
      }
      delete form.range.message;
      delete from.text;
      reminder.range.from = from;
    }

    if (form.repeat.enabled) {
      reminder.repeat = {};

      if (form.repeat.gap) {
        reminder.repeat.gap = Number(form.repeat.gap);
      }
      else {
        form.repeat.gapError = true;
      }

      if (form.repeat.ends === "occurences") {
        if (form.repeat.count) {
          reminder.repeat.count = Number(form.repeat.count);
        }
        else {
          form.repeat.countError = true;
        }
      }

      if (form.repeat.gapError || form.repeat.countError) {
        setForm({ ...form });
        return;
      }
    }
    reminders.push(reminder);

    createReminder(reminder, calendar);
    setForm(null);
    saveReminders(reminders);
  }

  function preventFormSubmit(event) {
    if (event.key === "Enter" && event.target.nodeName !== "BUTTON") {
      event.preventDefault();
    }
  }

  function validateHourFormat(value) {
    const regex24Hours = /^(([0-1]?[0-9])|(2[0-3])):[0-5]?[0-9]$/;
    const regex12Hours = /^((0?[1-9])|(1[0-2])):[0-5]?[0-9] ?[a|p|A|P][m|M]$/;

    return regex24Hours.test(value) || regex12Hours.test(value);
  }

  function handleRangeInputChange({ target }) {
    const { name, value } = target;

    if (validateHourFormat(value)) {
      delete form.range.message;
    }
    else if (value) {
      form.range.message = "Please provide valid time format.";
    }
    form.range[name].text = value;
    setForm({ ...form });
  }

  function handleRepeatInputChange({ target }) {
    const { name, value } = target;
    const regex = /^\d+$/;

    if (!value || regex.test(value)) {
      form.repeat[`${name}Error`] = false;
    }
    else if (name === "gap") {
      form.repeat.gapError = true;
    }
    else if (name === "count") {
      form.repeat.countError = true;
    }
    form.repeat[name] = value;
    setForm({ ...form });
  }

  function handleRadioInputChange({ target }) {
    if (target.type === "radio") {
      form.repeat.ends = target.value;
      setForm({ ...form });
    }
  }

  async function saveReminders(reminders) {
    const { default: cloneDeep } = await import("lodash.clonedeep");

    chromeStorage.set({ reminders: cloneDeep(reminders).map(reminder => {
      if (!reminder.range.from) {
        delete reminder.range;
      }

      if (reminder.repeat) {
        delete reminder.repeat.tooltip;
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

  function generateTimeTable() {
    const dataList = { items: [""] };
    let minutes = 0;
    let hours = 0;

    while (hours < 24) {
      dataList.items.push(timeDateService.getTimeString({ hours, minutes }));
      minutes += 30;

      if (minutes === 60) {
        hours += 1;
        minutes = 0;
      }
    }
    return dataList;
  }

  function handleFormFocus({ target }) {
    form.range.dataList.visible = true;
    form.range.dataList.name = target.name;
    form.range.dataList.x = target.offsetLeft + target.offsetWidth / 2;
    form.range.dataList.y = target.offsetTop + target.offsetHeight;

    setForm({...form });
  }

  function handleRangeInputBlur(event) {
    if (event.relatedTarget?.classList.contains("range-data-list-items")) {
      form.range.dataList.visible = false;
      setForm({...form });
    }
  }

  function selectDataItem({ target }) {
    if (ignoreFirstClick.current) {
      ignoreFirstClick.current = false;
      return;
    }
    let hide = !target.closest(".range-input");

    if (target.closest(".range-data-list")) {
      hide = false;

      if (target.nodeName === "LI") {
        hide = true;
        form.range[form.range.dataList.name].text = target.textContent;
      }
    }

    if (hide) {
      ignoreFirstClick.current = true;
      form.range.dataList.visible = false;
      setForm({...form });
    }
  }

  if (!day) {
    return <div className="calendar"></div>;
  }
  return (
    <div className="calendar">
      <div className={`calendar-header selected-day-header${form ? " selected-day-form-header" : ""}`}>
        <button className="btn icon-btn" onClick={backToCalendar} title="Back to calendar">
          <Icon id="chevron-left"/>
        </button>
        <span className="selected-day-title">{day.dateString}</span>
        <button className="btn icon-btn selected-day-header-btn" onClick={showForm} title="Create reminder">
          <Icon id="plus"/>
        </button>
      </div>
      {form ? (
        <form className="selected-day-form" onSubmit={handleFormSubmit} onKeyDown={preventFormSubmit}>
          <input type="text" className="input reminder-input" name="reminder" autoComplete="off" placeholder="Remind me to..." required/>
          <div className="reminder-form-row reminder-setting">
            <label className="checkbox-container calendar-checkbox-container">
              <input type="checkbox" className="sr-only checkbox-input" name="range"
                onChange={toggleFormCheckbox} checked={!form.range.enabled}/>
              <div className="checkbox">
                <div className="checkbox-tick"></div>
              </div>
              <span className="label-right">All day</span>
            </label>
            <label className="checkbox-container calendar-checkbox-container">
              <input type="checkbox" className="sr-only checkbox-input" name="repeat"
                onChange={toggleFormCheckbox} checked={form.repeat.enabled}/>
              <div className="checkbox">
                <div className="checkbox-tick"></div>
              </div>
              <span className="label-right">Repeat</span>
            </label>
          </div>
          {form.range.enabled && (
            <div className="reminder-setting" onFocus={handleFormFocus} onBlur={handleRangeInputBlur}>
              <div>
                <span>From</span>
                <span className="range-input-container">
                  <input type="text" className="input range-input" autoComplete="off" name="from"
                    onChange={handleRangeInputChange} value={form.range.from.text} required/>
                </span>
                <span>To</span>
                <span className="range-input-container">
                  <input type="text" className="input range-input" autoComplete="off" name="to"
                    onChange={handleRangeInputChange} value={form.range.to.text}/>
                </span>
              </div>
              {form.range.dataList.visible && (
                <div className="container range-data-list-panel" style={{ top: form.range.dataList.y, left: form.range.dataList.x }}>
                  <div className="range-data-list">
                    <ul className="range-data-list-items">
                      {form.range.dataList.items.map((item, i) => <li className="range-data-list-item" key={i}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              )}
              {form.range.message && <div className="reminder-error-message">{form.range.message}</div>}
            </div>
          )}
          {form.repeat.enabled && (
            <>
              <div className="reminder-setting">
                <div>
                  <span>Repeat every</span>
                  <input type="text" className="input repeat-input" name="gap" autoComplete="off"
                    value={form.repeat.gap} onChange={handleRepeatInputChange} required/>
                  <span>days</span>
                </div>
                {form.repeat.gapError && <div className="reminder-error-message">Please insert a whole number</div>}
              </div>
              <div className="reminder-setting" onChange={handleRadioInputChange}>
                <div>Ends</div>
                <label className="reminder-form-row">
                  <input type="radio" className="sr-only radio-input" name="ends" value="never" defaultChecked/>
                  <div className="radio"></div>
                  <span className="label-right">Never</span>
                </label>
                <label className="reminder-form-row">
                  <input type="radio" className="sr-only radio-input" name="ends" value="occurences"/>
                  <div className="radio"></div>
                  <span className="label-right">After</span>
                  <input type="text" className="input repeat-input" name="count" autoComplete="off"
                    value={form.repeat.count} onChange={handleRepeatInputChange}
                    disabled={form.repeat.ends === "never"} required={form.repeat.ends === "occurences"}/>
                  <span>occurrences</span>
                </label>
                {form.repeat.ends === "occurences" && form.repeat.countError && (
                  <div className="reminder-error-message">Please insert a whole number</div>
                )}
              </div>
            </>
          )}
          <div className="reminder-form-btns">
            <button type="button" className="btn text-btn" onClick={backToCalendar}>Cancel</button>
            <button className="btn">Add</button>
          </div>
        </form>
      ) : day.reminders.length > 0 ? (
        <ul className="selected-day-remainders">
          {day.reminders.map((reminder, i) => (
            <li className="selected-day-remainder" key={reminder.id}>
              <div className="selected-day-reminder-color" style={{ "backgroundColor": reminder.color }}
                onClick={() => changeReminderColor(reminder)}></div>
              {reminder.repeat && <Icon id="repeat" className="reminder-repeat-icon" title={reminder.repeat.tooltip}/>}
              <div>
                <div>{reminder.text}</div>
                <div className="calendar-reminder-range">{reminder.range.text}</div>
              </div>
              <button className="btn icon-btn alt-icon-btn selected-day-remainder-btn"
                onClick={() => removeReminder(reminder.id, i)} title="Remove">
                <Icon id="trash"/>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-reminder-list-message">No reminders</p>
      )}
    </div>
  );
}
