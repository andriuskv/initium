import { useState, useEffect, useRef } from "react";
import { setPageTitle } from "../../../utils";
import { padTime } from "services/timeDate";
import { getSetting, updateSetting } from "services/settings";
import { addToRunning, removeFromRunning, isLastRunningTimer } from "../running-timers";
import Icon from "components/Icon";
import "./pomodoro.css";

export default function Pomodoro({ visible, expand, exitFullscreen, handleReset }) {
  const [running, setRunning] = useState(false);
  const [state, setState] = useState(() => {
    const { duration } = getSetting("pomodoro");

    return parseDuration(duration * 60);
  });
  const [mode, setMode] = useState("duration");
  const [alarm, setAlarm] = useState({ shouldRun: true });
  const [settingForm, setSettingForm] = useState(null);
  const timeoutId = useRef(0);

  useEffect(() => {
    if (running) {
      timeoutId.current = setTimeout(() => {
        update(state.duration, performance.now());
      }, 1000);
      addToRunning("pomodoro");
    }
    else {
      removeFromRunning("pomodoro");
    }
    return () => {
      clearTimeout(timeoutId.current);
    };
  }, [running]);

  function toggle() {
    if (running) {
      stop();
    }
    else {
      start();
    }
  }

  function start() {
    if (!alarm.element) {
      setAlarm({ ...alarm, element: new Audio("./assets/alarm.mp3") });
    }
    setRunning(true);
    updateTitle(state);
  }

  function stop() {
    setRunning(false);
    updateTitle();
  }

  function update(duration, elapsed) {
    const interval = 1000;
    const diff = performance.now() - elapsed;

    elapsed += interval;
    duration -= 1;

    const state = parseDuration(duration);

    setState(state);
    updateTitle(state);

    if (duration > 0) {
      timeoutId.current = setTimeout(() => {
        update(duration, elapsed);
      }, interval - diff);
    }
    else if (alarm.shouldRun) {
      runAlarm();
    }
    else {
      setTimeout(reset, interval - diff);
    }
  }

  async function reset() {
    if (isLastRunningTimer("pomodoro")) {
      await handleReset("pomodoro");
    }
    resetTimer(mode);

    if (running) {
      setRunning(false);
      setPageTitle();
    }
  }

  function updateTitle(values) {
    if (isLastRunningTimer("pomodoro")) {
      if (values) {
        const { hours, minutes, seconds } = values;

        setPageTitle(`${hours ? `${hours} h ` : ""}${minutes ? `${minutes} m ` : ""}${seconds} s${getAlarmIcon()}`);
      }
      else {
        setPageTitle();
      }
    }
  }

  function selectMode(newMode) {
    if (newMode === mode) {
      return;
    }
    setMode(newMode);
    resetTimer(newMode);
  }

  function resetTimer(mode) {
    const settings = getSetting("pomodoro");
    const duration = settings[mode];

    setState(parseDuration(duration * 60));
  }

  function parseDuration(duration) {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor(duration / 60 % 60);
    const seconds = duration % 60;

    return {
      duration,
      hours,
      minutes: padTime(minutes, hours),
      seconds: padTime(seconds, hours || minutes)
    };
  }

  function toggleAlarm() {
    setAlarm({ ...alarm, shouldRun: !alarm.shouldRun });
  }

  function runAlarm() {
    const { alarmVolume } = getSetting("topPanel");

    alarm.element.volume = alarmVolume;
    alarm.element.play();

    setTimeout(() => {
      exitFullscreen();
      reset();
    }, 3000);
  }

  function getAlarmIcon() {
    return alarm.shouldRun ? " \uD83D\uDD14" : "";
  }

  function toggleSettings() {
    if (settingForm) {
      let setting = null;

      if (settingForm.error) {
        setting = getSetting("pomodoro");
      }
      else {
        setting = {
          duration: settingForm.duration,
          short: settingForm.short,
          long: settingForm.long
        };
      }
      setSettingForm(null);
      updateSetting({ pomodoro: setting });
      resetTimer(mode);
    }
    else {
      setSettingForm({ ...getSetting("pomodoro") });
    }
  }

  function handleInputChanage({ target }) {
    settingForm[target.name] = target.value;
    settingForm.error = !target.value || /\D/.test(target.value);
    setSettingForm({ ...settingForm });
  }

  return (
    <div className={`top-panel-item pomodoro${visible ? " visible" : ""}`}>
      {settingForm ? (
        <>
          <div>
            <div className="pomodoro-setting">
              <span>Pomodoro duration</span>
              <input type="text" className="input pomodoro-setting-input"
                value={settingForm.duration} onChange={handleInputChanage} name="duration"/>
            </div>
            <div className="pomodoro-setting">
              <span>Short break duration</span>
              <input type="text" className="input pomodoro-setting-input"
                value={settingForm.short} onChange={handleInputChanage} name="short"/>
            </div>
            <div className="pomodoro-setting">
              <span>Long break duration</span>
              <input type="text" className="input pomodoro-setting-input"
                value={settingForm.long} onChange={handleInputChanage} name="long"/>
            </div>
          </div>
          <div className="top-panel-hide-target top-panel-item-actions pomodoro-settings-footer">
            {settingForm.error && <p className="pomodoro-settings-message">Please enter valid positive number.</p>}
            <button className="btn text-btn" onClick={toggleSettings}>Done</button>
          </div>
        </>
      ) : (
        <>
          <div className="top-panel-item-content">
            <div className="pomodoro">
              {state.hours > 0 && (
                <>
                  <span className="top-panel-digit">{state.hours}</span>
                  <span className="top-panel-digit-sep">h</span>
                </>
              )}
              {(state.hours > 0 || state.minutes > 0) && (
                <>
                  <span className="top-panel-digit">{state.minutes}</span>
                  <span className="top-panel-digit-sep">m</span>
                </>
              )}
              <span className="top-panel-digit">{state.seconds}</span>
              <span className="top-panel-digit-sep">s</span>
            </div>
            {!running && (
              <div className="top-panel-hide-target pomodoro-selection">
                <button className={`btn text-btn pomodoro-btn${mode === "duration" ? " active" : ""}`}
                  onClick={() => selectMode("duration")}>Pomodoro</button>
                <button className={`btn text-btn pomodoro-btn${mode === "short" ? " active" : ""}`}
                  onClick={() => selectMode("short")}>Short Break</button>
                <button className={`btn text-btn pomodoro-btn${mode === "long" ? " active" : ""}`}
                  onClick={() => selectMode("long")}>Long Break</button>
              </div>
            )}
          </div>
          <div className="top-panel-hide-target top-panel-item-actions">
            <button className="btn text-btn top-panel-item-action-btn" onClick={toggle}>{running ? "Stop": "Start"}</button>
            <button className="btn text-btn top-panel-item-action-btn" onClick={reset}>Reset</button>
            <div className="top-panel-secondary-actions">
              {running ? (
                <button className="btn icon-btn" onClick={expand} title="Expand">
                  <Icon id="expand"/>
                </button>
              ) : (
                <>
                  <button className="btn icon-btn" onClick={toggleAlarm} title="Toggle alarm">
                    <Icon id={`bell${alarm.shouldRun ? "" : "-off"}`}/>
                  </button>
                  <button className="btn icon-btn" title="Toggle settings" onClick={toggleSettings}>
                    <Icon id="settings"/>
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
