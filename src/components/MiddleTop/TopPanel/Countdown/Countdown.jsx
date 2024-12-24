import { useState, useEffect, useRef, lazy } from "react";
import { dispatchCustomEvent, getRandomString } from "utils";
import { getSetting } from "services/settings";
import { formatDate } from "services/timeDate";
import * as chromeStorage from "services/chromeStorage";
import Icon from "components/Icon";
import CreateButton from "components/CreateButton";
import "./countdown.css";
import useWorker from "../../useWorker";

const Form = lazy(() => import("./Form"));

export default function Countdown({ visible, locale, animDirection, toggleIndicator }) {
  const [countdowns, setCountdowns] = useState([]);
  const { initWorker, destroyWorkers } = useWorker(updateCountdowns, [countdowns.length]);
  const running = useRef(0);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!countdowns.length) {
      running.current = false;
      destroyWorkers();
      return;
    }

    if (running.current) {
      return;
    }
    running.current = true;
    initWorker({ id: "countdown", type: "clock" });
  }, [countdowns]);

  async function init() {
    const countdowns = await chromeStorage.get("countdowns");

    if (countdowns?.length) {
      startCountdowns(countdowns);
      toggleIndicator("countdown", true);
      dispatchCustomEvent("indicator-visibility", true);
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
    const startDate = new Date();

    setCountdowns(countdowns.map(countdown => {
      const date = new Date(countdown.dateString);
      const diff = Math.round(Math.abs(date - startDate) / 1000);

      return {
        id: getRandomString(),
        title: countdown.title,
        date: getCountdownDateString(date),
        dateString: countdown.dateString,
        isInPast: countdown.isInPast,
        diff,
        ...parseDateDiff(diff)
      };
    }));
  }

  function updateCountdowns() {
    const startDate = new Date();
    const updatedCountdowns = [];
    let modified = false;

    for (const countdown of countdowns) {
      const endDate = new Date(countdown.dateString);
      const diff = Math.round(Math.abs(endDate - startDate) / 1000);

      if (countdown.willBeInPast) {
        countdown.isInPast = true;
        delete countdown.willBeInPast;
        modified = true;
      }
      else if (diff === 0) {
        countdown.willBeInPast = true;
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

    const parts = {
      years: years > 99 ? 99 : years,
      months,
      days,
      hours,
      minutes,
      seconds
    };

    if (Intl.DurationFormat) {
      const durationItems = new Intl.DurationFormat("en-US", { style: "long" }).formatToParts(parts);
      const durationParts = {};

      for (const item of durationItems) {
        if (item.unit) {
          durationParts[item.unit] ??= {};

          if (item.type === "integer") {
            durationParts[item.unit].value = parts[`${item.unit}s`];
          }
          else if (item.type === "unit") {
            durationParts[item.unit].unit = item.value;
          }
        }
      }
      return durationParts;

    }
    else {
      const durationParts = {};

      for (const key in parts) {
        durationParts[key.slice(0, -1)] = {
          value: parts[key],
          unit: parts[key] > 1 ? key: key.slice(0, -1)
        };
      }
      return durationParts;
    }
  }

  function showForm() {
    dispatchCustomEvent("fullscreen-modal", {
      id: "countdown",
      shouldToggle: true,
      component: Form,
      params: { locale, createCountdown }
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
    toggleIndicator("countdown", true);
    dispatchCustomEvent("indicator-visibility", true);
  }

  function removeCountdown(index) {
    countdowns.splice(index, 1);

    if (!countdowns.length) {
      toggleIndicator("countdown", false);
      dispatchCustomEvent("indicator-visibility", false);
    }
    setCountdowns([...countdowns]);
    saveCountdowns(countdowns);
  }

  function getCountdownDateString(date) {
    const { dateLocale } = getSetting("timeDate");

    return formatDate(date.getTime(), {
      locale: dateLocale,
      includeTime : date.getHours() || date.getMinutes()
    });
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
        <div className="countdown-items-container">
          <ul className="top-panel-item-content countdown-items">
            {countdowns.map((countdown, i) => (
              <li className="countdown-item" key={countdown.id}>
                {countdown.title && <div className="countdown-item-title">{countdown.title}</div>}
                <div className="countdown-item-timer">
                  {countdown.isInPast && (
                    <div className="countdown-item-timer-part">
                      <span className="countdown-item-timer-digit">-</span>
                    </div>
                  )}
                  {countdown.year?.value > 0 && (
                    <div className="countdown-item-timer-part">
                      <span className="countdown-item-timer-digit">{countdown.year.value}</span>
                      <span>{countdown.year.unit}</span>
                    </div>
                  )}
                  {countdown.month?.value > 0 && (
                    <div className="countdown-item-timer-part">
                      <span className="countdown-item-timer-digit">{countdown.month.value}</span>
                      <span>{countdown.month.unit}</span>
                    </div>
                  )}
                  {countdown.day?.value > 0 && (
                    <div className="countdown-item-timer-part">
                      <span className="countdown-item-timer-digit">{countdown.day.value}</span>
                      <span>{countdown.day.unit}</span>
                    </div>
                  )}
                  {countdown.hour?.value > 0 && (
                    <div className="countdown-item-timer-part">
                      <span className="countdown-item-timer-digit">{countdown.hour.value}</span>
                      <span>{countdown.hour.unit}</span>
                    </div>
                  )}
                  {countdown.minute?.value > 0 && (
                    <div className="countdown-item-timer-part">
                      <span className="countdown-item-timer-digit">{countdown.minute.value}</span>
                      <span>{countdown.minute.unit}</span>
                    </div>
                  )}
                  <div className="countdown-item-timer-part seconds">
                    <span className="countdown-item-timer-digit">{countdown.second.value}</span>
                    <span>{countdown.second.unit}</span>
                  </div>
                </div>
                <div className="countdown-item-date">{countdown.date}</div>
                <button className="btn icon-btn alt-icon-btn countdown-item-remove-btn" onClick={() => removeCountdown(i)}
                  title={locale.global.remove}>
                  <Icon id="trash"/>
                </button>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return <p className="top-panel-item-content countdowns-message">{locale.countdown.no_countdowns_message}</p>;
  }

  return (
    <div className={`container-body top-panel-item countdown${visible ? " visible" : ""}${animDirection ? ` ${animDirection}` : ""}`}>
      <CreateButton onClick={showForm} attrs={{ "data-modal-initiator": true }}></CreateButton>
      {renderCountdowns()}
    </div>
  );
}
