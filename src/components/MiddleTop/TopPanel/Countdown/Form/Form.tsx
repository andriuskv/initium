import type { Countdown } from "../countdown.types";
import { useState, useRef, type FormEvent, type ChangeEvent, type MouseEvent, type KeyboardEvent, type FocusEvent } from "react";
import { getRandomString } from "utils";
import { padTime, getMonthName, getTimeString, parseDateInputValue, getDateString } from "services/timeDate";
import { getSetting } from "services/settings";
import Icon from "components/Icon";
import "./form.css";
import type { TimeDateSettings } from "types/settings";

type Props = {
  locale: any,
  createCountdown: (countdown: Countdown) => void,
  hide: () => void
}

type FormType = {
  year: string | number,
  month: string | number,
  day: string | number,
  hours: string | number,
  minutes: string | number,
  message?: string,
  period?: string,
  dataList?: {
    name: string
    x: number,
    y: number,
    items: { value: string | number, displayValue: string | number }[]
  } | null
}

export default function Form({ locale, createCountdown, hide }: Props) {
  const [form, setForm] = useState<FormType>({
    year: "",
    month: "",
    day: "",
    hours: "",
    minutes: ""
  });
  const selected = useRef(false);

  function parseHours(hours: string): number {
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

  function handleFormSubmit(event: FormEvent) {
    interface FormElements extends HTMLFormControlsCollection {
      title: HTMLInputElement;
      year: HTMLInputElement;
      month: HTMLInputElement;
      day: HTMLInputElement;
      hours: HTMLInputElement;
      minutes: HTMLInputElement;
    }
    const formElement = event.target as HTMLFormElement;
    const { title, year, month, day, hours, minutes } = formElement.elements as FormElements;
    const h = parseHours(hours.value);

    event.preventDefault();

    if (Number.isNaN(h)) {
      setForm({ ...form, message: "Invalid hour format." });
      return;
    }
    const dateString = getDateString({
      year: Number(year.value),
      month: Number.parseInt(month.value, 10) - 1,
      day: Number(day.value),
      hours: h,
      minutes: Number(minutes.value)
    }, true);
    const date = new Date(dateString);

    if (date.toString() === "Invalid Date") {
      setForm({ ...form, message: "Invalid date." });
      return;
    }
    const dateNum = date.getTime();
    const currDateNum = Date.now();
    let diff = 0;
    let isInPast = false;

    if (dateNum - currDateNum > 0) {
      diff = dateNum - currDateNum;
    }
    else {
      diff = currDateNum - dateNum;
      isInPast = true;
    }
    createCountdown({
      dateString,
      id: getRandomString(4),
      title: title.value.trim(),
      isInPast,
      diff: Math.floor(diff / 1000),
      view: "year"
    });
    hide();
  }

  function handleFormKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && (event.target as HTMLInputElement).nodeName === "INPUT") {
      event.preventDefault();
    }
  }

  function handleInputChange(event: ChangeEvent) {
    const element = event.target as HTMLInputElement;

    setForm({
      ...form,
      [element.name]: element.value
    });
  }

  function handleFormFocus(event: FocusEvent) {
    const element = event.target as HTMLInputElement;
    const { name } = element;

    if (!name || name === "title" || element.nodeName === "BUTTON" || name === "dateinput") {
      return;
    }
    const dataList: FormType["dataList"] = {
      name,
      x: element.offsetLeft + element.offsetWidth / 2,
      y: element.offsetTop + element.offsetHeight,
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
      const { dateLocale } = getSetting("timeDate") as TimeDateSettings;
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
      const { format } = getSetting("timeDate") as TimeDateSettings;
      let hour = 0;

      while (hour < 24) {
        const value = format === 24 ? hour : getTimeString({ hours: hour, minutes: 0 }, { excludeMinutes: true });

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
      setForm({...form, dataList: undefined });
    }
    selected.current = false;
  }

  function selectValue({ target }: MouseEvent) {
    const listElement = (target as HTMLElement).closest("[data-list]");

    if (!listElement) {
      selected.current = false;
      setForm({
        ...form,
        dataList: undefined
      });
      return;
    }
    const value = (target as HTMLElement).getAttribute("data-item") || "";

    selected.current = true;

    if (!value) {
      return;
    }
    requestAnimationFrame(() => {
      if (form.dataList) {
        setForm({
          ...form,
          dataList: undefined,
          [form.dataList.name]: value
        });
      }
    });
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
    const element = document.querySelector("input[name=dateinput]") as HTMLInputElement;

    if (element) {
      element.showPicker();
    }
  }

  function handleDateInputChange(event: ChangeEvent) {
    const { value } = event.target as HTMLInputElement;

    if (value) {
      const data = parseDateInputValue(value, true);

      setForm({
        ...form,
        ...data,
        hours: data.period ? `${data.hours} ${data.period.toUpperCase()}` : data.hours!,
        month: (data.month + 1)
      });
    }
    else {
      resetDate();
    }
  }

  return (
    <form className="countdown-form" onSubmit={handleFormSubmit} onFocus={handleFormFocus} onBlur={handleFormBlur}
      onKeyDown={handleFormKeydown} autoComplete="off" onPointerDown={selectValue}>
      <div className="container-header">
        <h3 className="container-header-title">{locale.countdown.form_title}</h3>
      </div>
      <div className="container-body countdown-form-body">
        <div className="countdown-form-date-btn-container">
          <button type="button" className="btn icon-btn countdown-form-date-btn" title="Show date picker"
            onClick={showDatePicker} data-modal-keep>
            <Icon id="calendar"/>
          </button>
          <input type="datetime-local" name="dateinput" className="input" tabIndex={-1} onChange={handleDateInputChange}/>
        </div>
        <label>
          <div className="countdown-form-field-title">{locale.global.title_input_label}</div>
          <input type="text" className="input countdown-form-field" name="title"/>
        </label>
        <div className="countdown-form-fields">
          <label>
            <div className="countdown-form-field-title">{locale.global.year}</div>
            <input type="text" className="input countdown-form-field" name="year"
              onChange={handleInputChange} value={form.year} required/>
          </label>
          <label>
            <div className="countdown-form-field-title">{locale.global.month}</div>
            <input type="text" className="input countdown-form-field" name="month"
              onChange={handleInputChange} value={form.month} required/>
          </label>
          <label>
            <div className="countdown-form-field-title">{locale.global.day}</div>
            <input type="text" className="input countdown-form-field" name="day"
              onChange={handleInputChange} value={form.day} required/>
          </label>
        </div>
        <div className="countdown-form-fields">
          <label>
            <div className="countdown-form-field-title">{locale.global.hour}</div>
            <input type="text" className="input countdown-form-field" name="hours"
              onChange={handleInputChange} value={form.hours}/>
          </label>
          <label>
            <div className="countdown-form-field-title">{locale.global.minutes}</div>
            <input type="text" className="input countdown-form-field" name="minutes"
              onChange={handleInputChange} value={form.minutes}/>
          </label>
        </div>
        {form.dataList ? (
          <div className="container container-opaque countdown-form-field-datalist-container" style={{ top: form.dataList.y, left:  form.dataList.x }} data-list>
            <ul className={`countdown-form-field-datalist ${form.dataList.name}`} tabIndex={-1}>
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
