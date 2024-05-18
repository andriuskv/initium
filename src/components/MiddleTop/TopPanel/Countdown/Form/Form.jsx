import { useState, useRef } from "react";
import { getRandomString } from "utils";
import { padTime, getMonthName, getTimeString, parseDateInputValue } from "services/timeDate";
import { getSetting } from "services/settings";
import Icon from "components/Icon";
import "./form.css";

export default function Form({ locale, createCountdown, hide }) {
  const [form, setForm] = useState({
    year: "",
    month: "",
    day: "",
    hours: "",
    minutes: ""
  });
  const selected = useRef(false);

  function parseHours(hours) {
    const value = hours.trim();

    if (!value) {
      return 0;
    }
    const nValue = Number(value);

    if (nValue === 0 || nValue === 24) {
      return 0;
    }
    else if (nValue < 0 || nValue > 24) {
      return NaN;
    }
    else if (!Number.isNaN(nValue)) {
      return nValue;
    }
    const format12 = /^((0*?[1-9])|(1[0-2])) *?[a|p|A|P][m|M]$/;

    if (!format12.test(value)) {
      return NaN;
    }
    const h = Number.parseInt(value, 10);
    const suffix = value.slice(-2).toLowerCase();

    if (suffix === "am" && h === 12) {
      return 0;
    }
    else if (suffix === "pm" && h < 12) {
      return h + 12;
    }
    return h;
  }

  function handleFormSubmit(event) {
    const { title, year, month, day, hours, minutes } = event.target.elements;
    const h = parseHours(hours.value);

    event.preventDefault();

    if (Number.isNaN(h)) {
      setForm({ ...form, message: "Invalid hour format." });
      return;
    }
    const dateString = `${year.value}-${padTime(month.value)}-${padTime(day.value)}T${padTime(h)}:${padTime(minutes.value)}:00`;
    const date = new Date(dateString);

    if (date.toString() === "Invalid Date") {
      setForm({ ...form, message: "Invalid date." });
      return;
    }
    const currentDate = new Date();
    let diff = 0;
    let isInPast = false;

    if (date.getTime() - currentDate.getTime() > 0) {
      diff = date - currentDate;
    }
    else {
      diff = currentDate - date;
      isInPast = true;
    }
    createCountdown({
      dateString,
      id: getRandomString(4),
      date,
      title: title.value.trim(),
      isInPast,
      diff: Math.floor(diff / 1000)
    });
    hide();
  }

  function handleFormKeydown(event) {
    if (event.key === "Enter" && event.target.nodeName === "INPUT") {
      event.preventDefault();
    }
  }

  function handleInputChange({ target }) {
    form[target.name] = target.value;
    setForm({ ...form });
  }

  function handleFormFocus({ target }) {
    const { name } = target;

    if (name === "title" || target.nodeName === "BUTTON" || name === "dateinput") {
      return;
    }
    const dataList = {
      name,
      x: target.offsetLeft + target.offsetWidth / 2,
      y: target.offsetTop + target.offsetHeight,
      items: []
    };

    if (name === "year") {
      const date = new Date();
      const currentYear = date.getFullYear();
      let year = currentYear;

      while (year <= currentYear + 10) {
        dataList.items.push({
          value: year,
          displayValue: year
        });
        year += 1;
      }
    }
    else if (name === "month") {
      const { dateLocale } = getSetting("timeDate");
      let month = 0;

      while (month < 12) {
        dataList.items.push({
          value: month + 1,
          displayValue: `${padTime(month + 1)} - ${getMonthName(month, dateLocale, true)}`
        });
        month += 1;
      }
    }
    else if (name === "day") {
      let day = 1;

      while (day < 32) {
        dataList.items.push({
          value: day,
          displayValue: day
        });
        day += 1;
      }
    }
    else if (name === "hours") {
      const { format } = getSetting("timeDate");
      let hour = 0;

      while (hour < 24) {
        const value = format === 24 ? hour : getTimeString({ hours: hour }, { excludeMinutes: true });

        dataList.items.push({
          value,
          displayValue: value
        });
        hour += 1;
      }
    }
    else if (name === "minutes") {
      let minute = 0;

      while (minute < 60) {
        dataList.items.push({
          value: minute,
          displayValue: minute
        });
        minute += 5;
      }
    }
    setForm({...form, dataList });
  }

  function handleFormBlur() {
    if (!selected.current && form.dataList) {
      delete form.dataList;
      setForm({...form });
    }
    selected.current = false;
  }

  function selectValue({ target }) {
    const value = target.getAttribute("data-item");

    requestAnimationFrame(() => {
      if (value) {
        form[form.dataList.name] = value;
      }
      delete form.dataList;
      setForm({...form });
    });

    selected.current = true;
  }

  function resetDate() {
    setForm({
      ...form,
      year: "",
      month: "",
      day: "",
      hours: "",
      minutes: ""
    });
  }

  function showDatePicker() {
    const element = document.querySelector("input[name=dateinput]");

    if (element) {
      element.showPicker();
    }
  }

  function handleDateInputChange(event) {
    const { value } = event.target;

    if (value) {
      const data = parseDateInputValue(value, true);

      if (data.period) {
        data.hours = `${data.hours} ${data.period.toUpperCase()}`;
      }
      setForm({ ...form, ...data, month: data.month + 1 });
    }
    else {
      resetDate();
    }
  }

  return (
    <form className="countdown-form" onSubmit={handleFormSubmit} onFocus={handleFormFocus} onBlur={handleFormBlur}
      onKeyDown={handleFormKeydown} autoComplete="off">
      <div className="container-header">
        <h3 className="container-header-title">{locale.countdown.form_title}</h3>
      </div>
      <div className="container-body countdown-form-body">
        <div className="countdown-form-date-btn-container">
          <button type="button" className="btn icon-btn countdown-form-date-btn" title="Show date picker"
            onClick={showDatePicker} data-modal-keep>
            <Icon id="calendar"/>
          </button>
          <input type="datetime-local" name="dateinput" className="input" tabIndex="-1" onChange={handleDateInputChange}/>
        </div>
        <label>
          <div className="countdown-form-field-title">{locale.global.title_input_label}</div>
          <input type="text" className="input countdown-form-field" name="title"/>
        </label>
        <div className="countdown-form-fields">
          <label>
            <div className="countdown-form-field-title">{locale.countdown.year}</div>
            <input type="text" className="input countdown-form-field" name="year"
              onChange={handleInputChange} value={form.year} required/>
          </label>
          <label>
            <div className="countdown-form-field-title">{locale.countdown.month}</div>
            <input type="text" className="input countdown-form-field" name="month"
              onChange={handleInputChange} value={form.month} required/>
          </label>
          <label>
            <div className="countdown-form-field-title">{locale.countdown.day}</div>
            <input type="text" className="input countdown-form-field" name="day"
              onChange={handleInputChange} value={form.day} required/>
          </label>
        </div>
        <div className="countdown-form-fields">
          <label>
            <div className="countdown-form-field-title">{locale.countdown.hour}</div>
            <input type="text" className="input countdown-form-field" name="hours"
              onChange={handleInputChange} value={form.hours}/>
          </label>
          <label>
            <div className="countdown-form-field-title">{locale.countdown.minute}s</div>
            <input type="text" className="input countdown-form-field" name="minutes"
              onChange={handleInputChange} value={form.minutes}/>
          </label>
        </div>
        {form.dataList ? (
          <div className="container container-opaque countdown-form-field-datalist-container" style={{ top: form.dataList.y, left:  form.dataList.x }}>
            <ul className={`countdown-form-field-datalist ${form.dataList.name}`} onPointerDown={selectValue} tabIndex="-1">
              {form.dataList.items.map(item => (
                <li className="countdown-form-field-datalist-item" key={item.value} data-item={item.value}>{item.displayValue}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <div className="container-footer countdown-form-bottom">
        {form.message && <div className="countdown-form-bottom-message">{form.message}</div>}
        <button type="button" className="btn text-btn" onClick={hide}>Cancel</button>
        <button className="btn">Create</button>
      </div>
    </form>
  );
}
