import { useState } from "react";
import { getRandomString } from "utils";
import { padTime, getMonthName, getTimeString } from "services/timeDate";
import "./form.css";
import { getSetting } from "services/settings";

export default function Presets({ createCountdown, hide }) {
  const [form, setForm] = useState({
    years: "",
    months: "",
    days: "",
    hours: "",
    minutes: ""
  });

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
    const { title, years, months, days, hours, minutes } = event.target.elements;
    const h = parseHours(hours.value);

    event.preventDefault();

    if (Number.isNaN(h)) {
      setForm({ ...form, message: "Invalid hour format." });
      return;
    }
    const dateString = `${years.value}-${padTime(months.value)}-${padTime(days.value)}T${padTime(h)}:${padTime(minutes.value)}:00`;
    const date = new Date(dateString);

    if (date.toString() === "Invalid Date") {
      setForm({ ...form, message: "Invalid date." });
      return;
    }
    const currentDate = new Date();

    if (date.getTime() - currentDate.getTime() < 1000) {
      setForm({ ...form, message: "Can't countdown to the past." });
      return;
    }
    createCountdown({
      dateString,
      id: getRandomString(4),
      date,
      title: title.value.trim(),
      diff: Math.floor((date - currentDate) / 1000)
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
    setForm({...form });
  }

  function handleFormFocus({ target }) {
    const { name } = target;

    if (name === "title" || target.nodeName === "BUTTON") {
      return;
    }
    const dataList = {
      name,
      x: target.offsetLeft + target.offsetWidth / 2,
      y: target.offsetTop + target.offsetHeight,
      items: []
    };

    if (name === "years") {
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
    else if (name === "months") {
      let month = 0;

      while (month < 12) {
        dataList.items.push({
          value: month + 1,
          displayValue: `${padTime(month + 1)} - ${getMonthName(month, true)}`
        });
        month += 1;
      }
    }
    else if (name === "days") {
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
        const value = format === 24 ? hour : getTimeString({ hours: hour }, true);

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
    if (form.dataList) {
      delete form.dataList;
      setForm({...form });
    }
  }

  function selectValue({ target }) {
    const value = target.getAttribute("data-item");

    if (value) {
      form[form.dataList.name] = value;
    }
    delete form.dataList;
    setForm({...form });
  }

  return (
    <form onSubmit={handleFormSubmit} onFocus={handleFormFocus} onBlur={handleFormBlur}
      onKeyDown={handleFormKeydown} autoComplete="off">
      <label className="countdown-form-field-container">
        <div className="countdown-form-field-title">Title</div>
        <input type="text" className="input countdown-form-field" name="title"/>
      </label>
      <div className="countdown-form-fields-group">
        <div className="countdown-form-fields countdown-form-date-fields">
          <label className="countdown-form-field-container">
            <div className="countdown-form-field-title">Years</div>
            <input type="text" className="input countdown-form-field" name="years"
              onChange={handleInputChange} value={form.years} required/>
          </label>
          <label className="countdown-form-field-container">
            <div className="countdown-form-field-title">Months</div>
            <input type="text" className="input countdown-form-field" name="months"
              onChange={handleInputChange} value={form.months} required/>
          </label>
          <label className="countdown-form-field-container">
            <div className="countdown-form-field-title">Days</div>
            <input type="text" className="input countdown-form-field" name="days"
              onChange={handleInputChange} value={form.days} required/>
          </label>
        </div>
        <div className="countdown-form-fields countdown-form-date-fields">
          <label className="countdown-form-field-container">
            <div className="countdown-form-field-title">Hours</div>
            <input type="text" className="input countdown-form-field" name="hours"
              onChange={handleInputChange} value={form.hours}/>
          </label>
          <label className="countdown-form-field-container">
            <div className="countdown-form-field-title">Minutes</div>
            <input type="text" className="input countdown-form-field" name="minutes"
              onChange={handleInputChange} value={form.minutes}/>
          </label>
        </div>
        {form.dataList ? (
          <ul className={`container countdown-form-field-datalist ${form.dataList.name}`} onPointerDown={selectValue}
            style={{ top: form.dataList.y, left:  form.dataList.x }}>
            {form.dataList.items.map(item => (
              <li className="countdown-form-field-datalist-item" key={item.value} data-item={item.value}>{item.displayValue}</li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="countdown-form-bottom">
        {form.message && <div className="countdown-form-bottom-message">{form.message}</div>}
        <button type="button" className="btn text-btn countdown-form-bottom-btn" onClick={hide}>Cancel</button>
        <button className="btn countdown-form-bottom-btn">Create</button>
      </div>
    </form>
  );
}
