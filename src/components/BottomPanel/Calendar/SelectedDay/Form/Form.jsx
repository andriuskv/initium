import { useState, useEffect, useRef, useMemo } from "react";
import { getRandomHslColor } from "utils";
import { getWeekday, getWeekdays, getTimeString } from "services/timeDate";
import { getSetting } from "services/settings";
import "./form.css";

export default function Form({ form: initialForm, day, updateReminder, hide }) {
  const [form, setForm] = useState(() => getInitialForm(initialForm));
  const ignoreFirstClick = useRef(true);
  const weekdayNames = useMemo(() => {
    const { dateLocale } = getSetting("timeDate");
    return getWeekdays(dateLocale, "short");
  }, []);

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

  function getInitialForm(form) {
    const weekday = getWeekday(day.year, day.month, day.day);
    const weekdays = { static: [false, false, false, false, false, false, false] };

    weekdays.static[weekday] = true;

    const range = {
      enabled: false,
      dataList: generateTimeTable(),
      from: { text: "" },
      to: { text: "" },
      ...form.range
    };
    const repeat = {
      enabled: false,
      type: "custom",
      customTypeGapName: "days",
      currentWeekday: weekday,
      weekdays,
      ends: "never",
      gap: "",
      count: "",
      ...form.repeat
    };

    return { ...form, range, repeat };
  }

  function generateTimeTable() {
    const dataList = { items: [""] };
    let minutes = 0;
    let hours = 0;

    while (hours < 24) {
      dataList.items.push(getTimeString({ hours, minutes }));
      minutes += 30;

      if (minutes === 60) {
        hours += 1;
        minutes = 0;
      }
    }
    return dataList;
  }

  function validateHourFormat(value) {
    const regex24Hours = /^(([0-1]?[0-9])|(2[0-3])):[0-5]?[0-9]$/;
    const regex12Hours = /^((0?[1-9])|(1[0-2])):[0-5]?[0-9] ?[a|p|A|P][m|M]$/;

    return regex24Hours.test(value) || regex12Hours.test(value);
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
      oldId: form.id,
      index: form.reminderDayIndex,
      text: event.target.elements.reminder.value,
      color: form.color || getRandomHslColor(),
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
      reminder.repeat.type = form.repeat.type;

      delete form.repeat.gapError;

      if (form.repeat.type === "custom") {
        if (form.repeat.gap) {
          reminder.repeat.gap = Number(form.repeat.gap);
          reminder.repeat.customTypeGapName = form.repeat.customTypeGapName;
        }
        else {
          form.repeat.gapError = true;
        }
      }
      else if (form.repeat.type === "weekday") {
        const settings = getSetting("timeDate");

        reminder.repeat.firstWeekday = settings.firstWeekday;
        reminder.repeat.weekdays = {
          static: form.repeat.weekdays.static,
          dynamic: [...form.repeat.weekdays.static]
        };
      }

      if (form.repeat.ends === "occurrences") {
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
    updateReminder(reminder, form);
    hide();
  }

  function preventFormSubmit(event) {
    if (event.key === "Enter" && event.target.nodeName !== "BUTTON") {
      event.preventDefault();
    }
  }

  function toggleFormCheckbox(event) {
    form[event.target.name].enabled = !form[event.target.name].enabled;
    setForm({ ...form });
  }

  function handleRepeatTypeChange({ target }) {
    form.repeat.type = target.value;
    setForm({ ...form });
  }

  function handleCustomTypeGapNameChange({ target }) {
    form.repeat.customTypeGapName = target.value;
    setForm({ ...form });
  }

  function handleWeekdaySelection({ target }) {
    const weekday = Number(target.name);

    if (weekday === form.repeat.currentWeekday) {
      return;
    }
    form.repeat.weekdays.static[weekday] = target.checked;
    setForm({ ...form });
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

  function selectDataItem({ target }) {
    if (ignoreFirstClick.current) {
      ignoreFirstClick.current = false;
      return;
    }
    let hide = !target.closest(".reminder-range-input");

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

  return (
    <form className="reminder-form" onSubmit={handleFormSubmit} onKeyDown={preventFormSubmit}>
      <div className="container-header">
        <h3 className="container-header-title">Reminder form</h3>
      </div>
      <div className="container-body reminder-form-body">
        <input type="text" className="input" name="reminder" autoComplete="off" defaultValue={form.text} placeholder="Remind me to..." required/>
        <div className="reminder-form-row reminder-form-setting">
          <label className="checkbox-container">
            <input type="checkbox" className="sr-only checkbox-input" name="range"
              onChange={toggleFormCheckbox} checked={!form.range.enabled}/>
            <div className="checkbox">
              <div className="checkbox-tick"></div>
            </div>
            <span className="label-right">All day</span>
          </label>
          <label className="checkbox-container">
            <input type="checkbox" className="sr-only checkbox-input" name="repeat"
              onChange={toggleFormCheckbox} checked={form.repeat.enabled}/>
            <div className="checkbox">
              <div className="checkbox-tick"></div>
            </div>
            <span className="label-right">Repeat</span>
          </label>
          {form.repeat.enabled && (
            <div className="select-container reminder-form-repeat-type-selection">
              <select className="input select" onChange={handleRepeatTypeChange} value={form.repeat.type}>
                <option value="custom">Custom</option>
                <option value="weekday">Every weekday</option>
                <option value="week">Every week</option>
                <option value="month">Every month</option>
              </select>
            </div>
          )}
        </div>
        {form.range.enabled && (
          <div>
            <div className="reminder-form-setting" onFocus={handleFormFocus} onBlur={handleRangeInputBlur}>
              <label>
                <span className="label-left">From</span>
                <input type="text" className="input reminder-range-input" autoComplete="off" name="from"
                  onChange={handleRangeInputChange} value={form.range.from.text} required/>
              </label>
              <label>
                <span className="label-left">To</span>
                <input type="text" className="input reminder-range-input" autoComplete="off" name="to"
                  onChange={handleRangeInputChange} value={form.range.to.text}/>
              </label>
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
            {form.range.message && <div className="reminder-form-message">{form.range.message}</div>}
          </div>
        )}
        {form.repeat.enabled && (
          <>
            {form.repeat.type === "custom" ? (
              <div>
                <label className="reminder-form-setting">
                  <span className="label-left">Repeat every</span>
                  <span className="multi-input-container repeat-input-container">
                    <input type="text" className="input multi-input-left repeat-input" name="gap" autoComplete="off"
                      value={form.repeat.gap} onChange={handleRepeatInputChange} required/>
                    <select className="input select multi-input-right" onChange={handleCustomTypeGapNameChange} value={form.repeat.customTypeGapName}>
                      <option value="days">day(s)</option>
                      <option value="weeks">week(s)</option>
                      <option value="months">month(s)</option>
                    </select>
                  </span>
                </label>
                {form.repeat.gapError && <div className="reminder-form-message">Please insert a whole number.</div>}
              </div>
            ) : form.repeat.type === "weekday" ? (
              <div className="reminder-form-setting reminder-form-weeekdays">
                {form.repeat.weekdays.static.map((selected, index) => (
                  <label className="checkbox-container reminder-form-weekday" key={index}>
                    <input type="checkbox" className="sr-only checkbox-input" name={index}
                      onChange={handleWeekdaySelection} checked={selected || index === form.repeat.currentWeekday}
                      disabled={index === form.repeat.currentWeekday}/>
                    <div className="reminder-form-weekday-content">{weekdayNames[index]}</div>
                  </label>
                ))}
              </div>
            ) : null}
            <div className="reminder-form-setting reminder-form-column" onChange={handleRadioInputChange}>
              <div>Ends</div>
              <label className="reminder-form-row">
                <input type="radio" className="sr-only radio-input" name="ends"
                  value="never" defaultChecked={form.repeat.ends === "never"}/>
                <div className="radio"></div>
                <span className="label-right">Never</span>
              </label>
              <label className="reminder-form-row">
                <input type="radio" className="sr-only radio-input" name="ends"
                  value="occurrences" defaultChecked={form.repeat.ends === "occurrences"}/>
                <div className="radio"></div>
                <span className="label-right">After</span>
                <input type="text" className="input repeat-input" name="count" autoComplete="off"
                  value={form.repeat.count} onChange={handleRepeatInputChange}
                  disabled={form.repeat.ends === "never"} required={form.repeat.ends === "occurrences"}/>
                <span>occurrences</span>
              </label>
              {form.repeat.ends === "occurrences" && form.repeat.countError && (
                <div className="reminder-form-message">Please insert a whole number.</div>
              )}
            </div>
          </>
        )}
      </div>
      <div className="container-footer reminder-form-btns">
        <button type="button" className="btn text-btn" onClick={hide}>Cancel</button>
        <button className="btn">{form.updating ? "Update" : "Create"}</button>
      </div>
    </form>
  );
}
