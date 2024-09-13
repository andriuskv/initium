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

export default function Countdown({ visible, locale, toggleIndicator }) {
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
                    <span>{locale.countdown.year}{countdown.years === 1 ? "" : "s"}</span>
                  </div>
                )}
                {countdown.months > 0 && (
                  <div className="countdown-item-timer-part">
                    <span className="countdown-item-timer-digit">{countdown.months}</span>
                    <span>{locale.countdown.month}{countdown.months === 1 ? "" : "s"}</span>
                  </div>
                )}
                {countdown.days > 0 && (
                  <div className="countdown-item-timer-part">
                    <span className="countdown-item-timer-digit">{countdown.days}</span>
                    <span>{locale.countdown.day}{countdown.days === 1 ? "" : "s"}</span>
                  </div>
                )}
                {countdown.hours > 0 && (
                  <div className="countdown-item-timer-part">
                    <span className="countdown-item-timer-digit">{countdown.hours}</span>
                    <span>{locale.countdown.hour}{countdown.hours === 1 ? "" : "s"}</span>
                  </div>
                )}
                {countdown.minutes > 0 && (
                  <div className="countdown-item-timer-part">
                    <span className="countdown-item-timer-digit">{countdown.minutes}</span>
                    <span>{locale.countdown.minute}{countdown.minutes === 1 ? "" : "s"}</span>
                  </div>
                )}
                <div className="countdown-item-timer-part seconds">
                  <span className="countdown-item-timer-digit">{countdown.seconds}</span>
                  <span>{locale.countdown.second}{countdown.seconds === 1 ? "" : "s"}</span>
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
      );
    }
    return <p className="countdowns-message">{locale.countdown.no_countdowns_message}</p>;
  }

  return (
    <div className={`container-body top-panel-item countdown${visible ? " visible" : ""}`}>
      <CreateButton onClick={showForm} attrs={{ "data-modal-initiator": true }}></CreateButton>
      {renderCountdowns()}
    </div>
  );
}
