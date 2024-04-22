import { useState, useEffect, useRef, useMemo } from "react";
import { getRandomHexColor, hslStringToHex } from "utils";
import { padTime, getWeekday, getWeekdays, getTimeString, formatDate } from "services/timeDate";
import { getSetting } from "services/settings";
import { createCalendarEvent, updateCalendarEvent } from "services/calendar";
import { useMessage } from "hooks";
import Icon from "components/Icon";
import "./form.css";
import Dropdown from "../../../Dropdown/Dropdown";

export default function Form({ form: initialForm, locale, user, googleCalendars, updateReminder, hide }) {
  const [form, setForm] = useState(() => getInitialForm(structuredClone(initialForm)));
  const [message, showMessage, dismissMessage] = useMessage("");
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
    const { dateLocale } = getSetting("timeDate");
    const weekday = getWeekday(form.year, form.month, form.day);
    const weekdays = { static: [false, false, false, false, false, false, false] };

    weekdays.static[weekday] = true;

    if (form.updating) {
      if (form.range) {
        form.range.enabled = form.range.text !== "All day";

        if (form.range.from) {
          form.range.from = { text: `${form.range.from.hours}:${padTime(form.range.from.minutes)}`};
        }

        if (form.range.to) {
          form.range.to = { text: `${form.range.to.hours}:${padTime(form.range.to.minutes)}`};
        }
      }

      if (form.repeat) {
        form.repeat = {
          ...form.repeat,
          enabled: true,
          type: form.repeat.type || "custom",
          ends: form.repeat.count > 0 ? "occurrences" : "never",
          gap: form.repeat.gap,
          count: form.repeat.count,
          year: form.year,
          month: form.month,
          day: form.day
        };

        if (form.repeat.type === "weekday") {
          form.repeat.weekdays = { static: [...form.repeat.weekdays.dynamic] };
          form.repeat.weekdays.static[form.repeat.currentWeekday] = true;
        }
      }
    }

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
      endDateString: form.repeat?.endDate ? getDateInputString({
        year: form.repeat.endDate.year,
        month: form.repeat.endDate.month,
        day: form.repeat.endDate.day
      }) : undefined,
      minEndDateString: getDateInputString({
        year: form.year,
        month: form.month,
        day: form.day
      }),
      ...form.repeat
    };

    if (repeat.endDateString) {
      repeat.ends = "date";
    }
    form.pickerColor = form.color ? form.color.startsWith("hsl") ? hslStringToHex(form.color) : form.color : getRandomHexColor();
    form.dateString = getDateInputString(form);
    form.displayDateString = formatDate(new Date(form.year, form.month, form.day), { locale: dateLocale });

    return { type: "normal", ...form, range, repeat };
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
    const elements = event.target.elements;

    event.preventDefault();

    const reminder = {
      creationDate: Date.now(),
      oldId: form.id,
      text: elements.reminder.value,
      color: elements.color ? elements.color.value : "",
      year: form.year,
      month: form.month,
      day: form.day
    };

    if (form.range.enabled) {
      const from = parseTimeString(form.range.from.text);
      const to = parseTimeString(form.range.to.text);

      reminder.range = {};

      if (to) {
        if (!from || to.hours < from.hours || (to.hours === from.hours && to.minutes <= from.minutes)) {
          form.range.message = locale.calendar.form.invalid_range_message;
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

      delete form.repeat.dateMessage;
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
      else if (form.repeat.ends === "date") {
        const dateString = elements.enddate.value;

        if (!dateString) {
          form.repeat.dateMessage = "Please provide date.";
          setForm({ ...form });
          return;
        }
        const endDate = parseDateInputValue(dateString);

        if (new Date(endDate.year, endDate.month, endDate.day) < new Date(form.year, form.month, form.day)) {
          form.repeat.dateMessage = "Date should be higher that the current selected date.";
          setForm({ ...form });
          return;
        }
        reminder.repeat.endDate = endDate;
      }

      if (form.repeat.gapError || form.repeat.countError) {
        setForm({ ...form });
        return;
      }
    }

    if (form.type === "google") {
      const primaryCalendar = googleCalendars.find(calendar => calendar.primary);

      reminder.type = "google";
      reminder.color = primaryCalendar.color;
      reminder.editable = true;

      if (form.updating) {
        const success = updateCalendarEvent(reminder, primaryCalendar.id);

        if (!success) {
          showMessage("Unable to update an event. Try again later.");
          return;
        }
      }
      else {
        const success = createCalendarEvent(reminder, primaryCalendar.id);

        if (!success) {
          showMessage("Unable to create an event. Try again later.");
          return;
        }
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

  function setReminderType(type) {
    setForm({ ...form, type });
  }

  function toggleFormCheckbox(event) {
    form[event.target.name].enabled = !form[event.target.name].enabled;
    delete form.repeat.dateMessage;
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
      form.range.message = locale.calendar.form.invalid_time_format_message;
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

  function getDateInputString({ year, month, day }) {
    return `${year}-${padTime(month + 1)}-${padTime(day)}`;
  }

  function parseDateInputValue(value) {
    const values = value.split("-");
    return {
      year: parseInt(values[0], 10),
      month: parseInt(values[1], 10) - 1,
      day: parseInt(values[2], 10)
    };
  }

  function showSelectedDayPicker() {
    const element = document.querySelector("input[name=selecteddate]");

    if (element) {
      element.showPicker();
    }
  }

  function handleSelectedDayInputChange(event) {
    const { dateLocale } = getSetting("timeDate");
    const displayDate = parseDateInputValue(event.target.value);
    const displayDateString = formatDate(new Date(displayDate.year, displayDate.month, displayDate.day), { locale: dateLocale });

    const weekday = getWeekday(displayDate.year, displayDate.month, displayDate.day);

    form.repeat.weekdays.static[form.repeat.currentWeekday] = false;
    form.repeat.currentWeekday = weekday;
    form.repeat.weekdays.static[weekday] = true;

    setForm({ ...form, ...displayDate, dateString: event.target.value, displayDateString });
  }

  return (
    <form className="reminder-form" onSubmit={handleFormSubmit} onKeyDown={preventFormSubmit}>
      <div className="container-header">
        {form.type === "google" ? (
          <img src="assets/google-product-logos/calendar.png" className="reminder-form-header-icon"
            width="24px" height="24px" loading="lazy" alt=""></img>
        ) : <Icon id="calendar" className="reminder-form-header-icon"/>}
        <h3 className="container-header-title">{locale.calendar.form.title}</h3>
      </div>
      <div className="container-body reminder-form-body">
        <div className="reminder-form-display-date">
          {form.type === "google" ? null : <div className="reminder-form-color-picker-container">
            <input type="color" name="color" className="reminder-form-color-picker"
              defaultValue={form.pickerColor} title={locale.global.color_input_title} data-modal-keep/>
          </div>}
          <div className="reminder-form-display-date-container">
            <button type="button" className="btn text-btn reminder-form-display-date-btn" title="Show date picker"
              onClick={showSelectedDayPicker} data-modal-keep>{form.displayDateString}</button>
            <input type="date" name="selecteddate" className="input reminder-form-display-date-input" tabIndex="-1"
              value={form.dateString} onChange={handleSelectedDayInputChange}/>
          </div>
          {!form.updating && user ? (
            <Dropdown container={{ className: "reminder-form-display-date-dropdown" }}>
              <div className="dropdown-group">
                <h4 className="reminder-form-display-date-dropdown-title">Reminder type</h4>
              </div>
              <div className="dropdown-group">
                <button type="button" className={`btn text-btn dropdown-btn${form.type === "normal" ? " active" : ""}`}
                  onClick={() => setReminderType("normal")}>Normal reminder</button>
                <button type="button" className={`btn text-btn dropdown-btn${form.type === "google" ? " active" : ""}`}
                  onClick={() => setReminderType("google")}>Google event</button>
              </div>
            </Dropdown>
          ) : null}
        </div>
        <input type="text" className="input" name="reminder" autoComplete="off" defaultValue={form.text} placeholder="Remind me to..." required/>
        <div className="reminder-form-row reminder-form-setting">
          <label className="checkbox-container">
            <input type="checkbox" className="sr-only checkbox-input" name="range"
              onChange={toggleFormCheckbox} checked={!form.range.enabled}/>
            <div className="checkbox">
              <div className="checkbox-tick"></div>
            </div>
            <span className="label-right">{locale.calendar.form.range_label}</span>
          </label>
          <label className="checkbox-container">
            <input type="checkbox" className="sr-only checkbox-input" name="repeat"
              onChange={toggleFormCheckbox} checked={form.repeat.enabled}/>
            <div className="checkbox">
              <div className="checkbox-tick"></div>
            </div>
            <span className="label-right">{locale.calendar.form.repeat_label}</span>
          </label>
          {form.repeat.enabled && (
            <div className="select-container reminder-form-repeat-type-selection">
              <select className="input select" onChange={handleRepeatTypeChange} value={form.repeat.type}>
                <option value="custom">{locale.calendar.form.repeat_option_custom}</option>
                <option value="weekday">{locale.calendar.form.repeat_option_weekday}</option>
                <option value="week">{locale.calendar.form.repeat_option_week}</option>
                <option value="month">{locale.calendar.form.repeat_option_month}</option>
              </select>
            </div>
          )}
        </div>
        {form.range.enabled && (
          <div>
            <div className="reminder-form-setting" onFocus={handleFormFocus} onBlur={handleRangeInputBlur}>
              <label>
                <span className="label-left">{locale.calendar.form.range_from_label}</span>
                <input type="text" className="input reminder-range-input" autoComplete="off" name="from"
                  onChange={handleRangeInputChange} value={form.range.from.text} required/>
              </label>
              <label>
                <span className="label-left">{locale.calendar.form.range_to_label}</span>
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
            {form.range.message && <div className="reminder-form-input-message">{form.range.message}</div>}
          </div>
        )}
        {form.repeat.enabled && (
          <>
            {form.repeat.type === "custom" ? (
              <div>
                <label className="reminder-form-setting">
                  <span>{locale.calendar.form.repeat_custom_label}</span>
                  <span className="multi-input-container repeat-input-container">
                    <input type="text" className="input multi-input-left repeat-input" name="gap" autoComplete="off"
                      value={form.repeat.gap} onChange={handleRepeatInputChange} required/>
                    <select className="input select multi-input-right" onChange={handleCustomTypeGapNameChange} value={form.repeat.customTypeGapName}>
                      <option value="days">{locale.calendar.form.repeat_custom_option_days}</option>
                      <option value="weeks">{locale.calendar.form.repeat_custom_option_weeks}</option>
                      <option value="months">{locale.calendar.form.repeat_custom_option_months}</option>
                    </select>
                  </span>
                </label>
                {form.repeat.gapError && <div className="reminder-form-input-message">{locale.calendar.form.invalid_number_message}</div>}
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
              <div>{locale.calendar.form.repeat_end_setting_label}</div>
              <label className="reminder-form-row">
                <input type="radio" className="sr-only radio-input" name="ends"
                  value="never" defaultChecked={form.repeat.ends === "never"}/>
                <div className="radio"></div>
                <span className="label-right">{locale.calendar.form.repeat_end_setting_never_label}</span>
              </label>
              <label className="reminder-form-row">
                <input type="radio" className="sr-only radio-input" name="ends"
                  value="date" defaultChecked={form.repeat.ends === "date"}/>
                <div className="radio"></div>
                <span className="label-right">On</span>
                <input type="date" name="enddate" className="input reminder-form-end-date-input" data-modal-keep
                  min={form.repeat.minEndDate} defaultValue={form.repeat.endDateString}
                  disabled={form.repeat.ends !== "date"} required={form.repeat.ends === "date"}/>
              </label>
              {form.repeat.ends === "date" && form.repeat.dateMessage && (
                <div className="reminder-form-input-message">{form.repeat.dateMessage}</div>
              )}
              <label className="reminder-form-row">
                <input type="radio" className="sr-only radio-input" name="ends"
                  value="occurrences" defaultChecked={form.repeat.ends === "occurrences"}/>
                <div className="radio"></div>
                <span className="label-right">After</span>
                <input type="text" className="input repeat-input" name="count" autoComplete="off"
                  value={form.repeat.count} onChange={handleRepeatInputChange}
                  disabled={form.repeat.ends !== "occurrences"} required={form.repeat.ends === "occurrences"}/>
                <span>occurrences</span>
              </label>
              {form.repeat.ends === "occurrences" && form.repeat.countError && (
                <div className="reminder-form-input-message">{locale.calendar.form.invalid_number_message}</div>
              )}
            </div>
          </>
        )}
      </div>
      {message ? (
        <div className="container container-opaque calendar-message-container reminder-form-message">
          <p className="calendar-message">{message}</p>
          <button className="btn icon-btn" onClick={dismissMessage} title="Dismiss">
            <Icon id="cross"/>
          </button>
        </div>
      ) : null}
      <div className="container-footer reminder-form-btns">
        <button type="button" className="btn text-btn" onClick={hide}>{locale.global.cancel}</button>
        <button className="btn">{form.updating ? locale.global.update : locale.global.create}</button>
      </div>
    </form>
  );
}
