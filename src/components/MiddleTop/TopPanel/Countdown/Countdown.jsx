import { useState, useEffect, useRef } from "react";
import { dispatchCustomEvent, getRandomString } from "utils";
import { getDate, getTimeString } from "services/timeDate";
import * as chromeStorage from "services/chromeStorage";
import Icon from "components/Icon";
import "./countdown.css";
import Form from "./Form";

export default function Countdown({ visible }) {
  const [countdowns, setCountdowns] = useState([]);
  const timeoutId = useRef(0);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!countdowns.length) {
      return;
    }
    timeoutId.current = setTimeout(() => {
      updateCountdowns();
    }, 1000);

    return () => {
      clearTimeout(timeoutId.current);
    };
  }, [countdowns]);

  async function init() {
    const countdowns = await chromeStorage.get("countdowns");

    if (countdowns?.length) {
      dispatchCustomEvent("indicator-visibility", true);
      startCountdowns(countdowns);
    }

    chromeStorage.subscribeToChanges(({ countdowns }) => {
      if (!countdowns) {
        return;
      }

      if (countdowns.newValue) {
        startCountdowns(countdowns.newValue);
      }
      else {
        setCountdowns([]);
      }
    });
  }

  function startCountdowns(countdowns) {
    setCountdowns(countdowns.map(countdown => {
      const date = new Date(countdown.dateString);

      return {
        id: getRandomString(),
        title: countdown.title,
        date: getCountdownDateString(date),
        dateString: countdown.dateString,
        isInPast: countdown.isInPast
      };
    }));
  }

  function updateCountdowns() {
    const startDate = new Date();
    const updatedCountdowns = [];
    let modified = false;

    for (const countdown of countdowns) {
      const endDate = new Date(countdown.dateString);
      let diff = Math.floor((countdown.isInPast ? startDate - endDate : endDate - startDate) / 1000);

      if (diff < 0) {
        countdown.isInPast = true;
        diff *= -1;
        modified = true;
      }
      updatedCountdowns.push({
        ...countdown,
        ...parseDateDiff(diff),
        diff
      });
    }
    setCountdowns(updatedCountdowns);

    if (modified) {
      saveCountdowns(updatedCountdowns);
    }
  }

  function parseDateDiff(duration) {
    if (duration < 0) {
      return { seconds: 0 };
    }
    const years = Math.floor(duration / 31540000);
    duration %= 31540000;
    const months = Math.floor(duration / 2628000);
    duration %= 2628000;
    const days = Math.floor(duration / 86400);
    duration %= 86400;
    const hours = Math.floor(duration / 3600);
    duration %= 3600;
    const minutes = Math.floor(duration / 60);
    duration %= 60;
    const seconds = duration;

    return {
      years: years > 99 ? 99 : years,
      months,
      days,
      hours,
      minutes,
      seconds
    };
  }

  function showForm() {
    dispatchCustomEvent("fullscreen-modal", {
      component: Form,
      params: { createCountdown }
    });
  }

  function createCountdown(countdown) {
    countdowns.unshift({
      ...countdown,
      date: getCountdownDateString(countdown.date),
      ...parseDateDiff(countdown.diff)
    });
    setCountdowns([...countdowns]);
    saveCountdowns(countdowns);
    dispatchCustomEvent("indicator-visibility", true);
  }

  function removeCountdown(index) {
    countdowns.splice(index, 1);

    if (!countdowns.length) {
      dispatchCustomEvent("indicator-visibility", false);
    }
    setCountdowns([...countdowns]);
    saveCountdowns(countdowns);
  }

  function getCountdownDateString(date) {
    const dateString = getDate("month day, year", {
      day: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      dayWithSuffix: false
    });
    return `${dateString} ${getTime(date)}`;
  }

  function getTime(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();

    if (hours === 0 && minutes === 0) {
      return "";
    }
    return getTimeString({ hours, minutes });
  }

  function saveCountdowns(countdowns) {
    chromeStorage.set({
      countdowns: countdowns.map(countdown => ({
        title: countdown.title,
        dateString: countdown.dateString,
        isInPast: countdown.isInPast
      }))
    });
  }

  function renderCountdowns() {
    if (countdowns.length) {
      return (
        <ul className="countdown-items">
          {countdowns.map((countdown, i) => (
            <li className="countdown-item" key={countdown.id}>
              {countdown.title && <div className="countdown-item-title">{countdown.title}</div>}
              <div className="countdown-item-timer">
                {countdown.isInPast && (
                  <div className="countdown-item-timer-part">
                    <span className="countdown-item-timer-digit">-</span>
                  </div>
                )}
                {countdown.years > 0 && (
                  <div className="countdown-item-timer-part">
                    <span className="countdown-item-timer-digit">{countdown.years}</span>
                    <span>Year{countdown.years === 1 ? "" : "s"}</span>
                  </div>
                )}
                {countdown.months > 0 && (
                  <div className="countdown-item-timer-part">
                    <span className="countdown-item-timer-digit">{countdown.months}</span>
                    <span>Month{countdown.months === 1 ? "" : "s"}</span>
                  </div>
                )}
                {countdown.days > 0 && (
                  <div className="countdown-item-timer-part">
                    <span className="countdown-item-timer-digit">{countdown.days}</span>
                    <span>Day{countdown.days === 1 ? "" : "s"}</span>
                  </div>
                )}
                {countdown.hours > 0 && (
                  <div className="countdown-item-timer-part">
                    <span className="countdown-item-timer-digit">{countdown.hours}</span>
                    <span>Hour{countdown.hours === 1 ? "" : "s"}</span>
                  </div>
                )}
                {countdown.minutes > 0 && (
                  <div className="countdown-item-timer-part">
                    <span className="countdown-item-timer-digit">{countdown.minutes}</span>
                    <span>Minute{countdown.minutes === 1 ? "" : "s"}</span>
                  </div>
                )}
                <div className="countdown-item-timer-part">
                  <span className="countdown-item-timer-digit">{countdown.seconds}</span>
                  <span>Second{countdown.seconds === 1 ? "" : "s"}</span>
                </div>
              </div>
              <div className="countdown-item-date">{countdown.date}</div>
              <button className="btn icon-btn alt-icon-btn countdown-item-remove-btn" onClick={() => removeCountdown(i)} title="Remove">
                <Icon id="trash"/>
              </button>
            </li>
          ))}
        </ul>
      );
    }
    return <p className="countdowns-message">No countdowns</p>;
  }

  return (
    <div className={`top-panel-item countdown${visible ? " visible" : ""}`}>
      <button className="btn icon-text-btn countdown-create-btn" onClick={showForm}>
        <Icon id="plus"/>
        <span className="countdown-create-btn-title">Create</span>
      </button>
      {renderCountdowns()}
    </div>
  );
}
