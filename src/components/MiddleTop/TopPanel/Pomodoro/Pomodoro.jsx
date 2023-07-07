import { useState, useEffect, useRef } from "react";
import { setPageTitle } from "utils";
import { padTime } from "services/timeDate";
import { getSetting } from "services/settings";
import { addToRunning, removeFromRunning, isLastRunningTimer } from "../running-timers";
import Icon from "components/Icon";
import "./pomodoro.css";

export default function Pomodoro({ visible, expand, exitFullscreen, handleReset }) {
  const [running, setRunning] = useState(false);
  const [state, setState] = useState(() => {
    const { pomodoro: { focus } } = getSetting("timers");
    return parseDuration(focus * 60);
  });
  const [stage, setStage] = useState("focus");
  const [alarm, setAlarm] = useState({ shouldRun: true });
  const [label, setLabel] = useState("");
  const timeoutId = useRef(0);
  const stages = {
    focus: "Focus",
    short: "Short break",
    long: "Long break"
  };

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
    resetTimer(stage);

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

  function selectStage(newStage) {
    if (newStage === stage) {
      return;
    }
    setStage(newStage);
    resetTimer(newStage);
  }

  function resetTimer(stage) {
    const { pomodoro: settings } = getSetting("timers");
    const duration = settings[stage];

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
    const { alarmVolume } = getSetting("timers");

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

  function handleLabelInputChange(event) {
    setLabel(event.target.value);
  }

  return (
    <div className={`top-panel-item pomodoro${visible ? " visible" : ""}`}>
      <div className="top-panel-item-content pomodoro-content">
        <div className="pomodoro">
          {running ? label ? (
            <h4 className="top-panel-item-content-label pomodoro-label">
              <div>{label}</div>
              <div className="pomodoro-stage">{stages[stage]}</div>
            </h4>
          ) : <h4 className="top-panel-item-content-label">{stages[stage]}</h4> : (
            <div className="top-panel-item-content-top">
              <input type="text" className="input" placeholder="Label" autoComplete="off" value={label} onChange={handleLabelInputChange}/>
            </div>
          )}
          <div>
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
        </div>
        {!running && (
          <div className="top-panel-hide-target pomodoro-selection">
            {Object.keys(stages).map(key => (
              <button className={`btn text-btn pomodoro-btn${stage === key ? " active" : ""}`} key={key}
                onClick={() => selectStage(key)}>{stages[key]}</button>
            ))}
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
            <button className="btn icon-btn" onClick={toggleAlarm} title="Toggle alarm">
              <Icon id={`bell${alarm.shouldRun ? "" : "-off"}`}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
