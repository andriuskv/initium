import { useState, useEffect, useRef } from "react";
import { dispatchCustomEvent, setPageTitle } from "utils";
import { padTime } from "services/timeDate";
import * as chromeStorage from "services/chromeStorage";
import { getSetting } from "services/settings";
import { addToRunning, removeFromRunning, isLastRunningTimer } from "../running-timers";
import Dropdown from "components/Dropdown";
import Icon from "components/Icon";
import "./timer.css";
import Inputs from "./Inputs";
import Presets from "./Presets";

export default function Timer({ visible, expand, exitFullscreen, handleReset }) {
  const [running, setRunning] = useState(false);
  const [state, setState] = useState({
    hours: "00",
    minutes: "00",
    seconds: "00"
  });
  const [presets, setPresets] = useState([]);
  const [activePreset, setActivePreset] = useState(null);
  const [alarm, setAlarm] = useState({ shouldRun: true });
  const [label, setLabel] = useState("");
  const timeoutId = useRef(0);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (running) {
      timeoutId.current = setTimeout(() => {
        update(state.duration, performance.now());
      }, 1000);
      addToRunning("timer");
    }
    else {
      removeFromRunning("timer");
    }
    return () => {
      clearTimeout(timeoutId.current);
    };
  }, [running]);

  async function init() {
    const timer = await chromeStorage.get("timer");

    if (timer?.length) {
      setPresets(timer);
    }
    chromeStorage.subscribeToChanges(({ timer }) => {
      if (!timer) {
        return;
      }

      if (timer.newValue) {
        setPresets(timer.newValue);
      }
      else {
        setActivePreset(null);
        setPresets([]);
        resetState();
      }
    });
  }

  function toggle() {
    if (running) {
      stop();
    }
    else {
      start();
    }
  }

  function start() {
    const values = normalizeValues();
    const duration = calculateDuration(values);

    if (duration) {
      const paddedMinutes = padTime(values.minutes, values.hours);
      const paddedSeconds = padTime(values.seconds, values.hours || values.minutes);

      if (!alarm.element) {
        setAlarm({ ...alarm, element: new Audio("./assets/alarm.mp3") });
      }
      setRunning(true);
      setState({
        hours: values.hours,
        minutes: paddedMinutes,
        seconds: paddedSeconds,
        duration
      });

      updateTitle({ hours: values.hours, minutes: values.hours || values.minutes ? paddedMinutes : "", seconds: paddedSeconds });
    }
  }

  function stop() {
    setState({
      hours: padTime(state.hours),
      minutes: padTime(state.minutes),
      seconds: padTime(state.seconds)
    });
    setRunning(false);
    updateTitle();
  }

  function normalizeValues() {
    let hours = Number.parseInt(state.hours, 10);
    let minutes = Number.parseInt(state.minutes, 10);
    let seconds = Number.parseInt(state.seconds, 10);

    if (seconds >= 60) {
      seconds -= 60;
      minutes += 1;
    }

    if (minutes >= 60) {
      minutes -= 60;
      hours += 1;
    }

    if (hours > 99) {
      hours = 99;
    }

    return { hours, minutes, seconds };
  }

  function calculateDuration({ hours, minutes, seconds }) {
    return seconds + (minutes * 60) + (hours * 3600);
  }

  function update(duration, elapsed) {
    const interval = 1000;
    const diff = performance.now() - elapsed;

    elapsed += interval;
    duration -= 1;

    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor(duration / 60 % 60);
    const seconds = duration % 60;
    const paddedMinutes = padTime(minutes, hours);
    const paddedSeconds = padTime(seconds, hours || minutes);

    setState({
      hours,
      minutes: paddedMinutes,
      seconds: paddedSeconds
    });

    updateTitle({ hours, minutes: hours || minutes ? paddedMinutes : "", seconds: paddedSeconds });

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
    if (isLastRunningTimer("timer")) {
      await handleReset("timer");
    }

    if (activePreset) {
      setState({
        hours: activePreset.hours,
        minutes: activePreset.minutes,
        seconds: activePreset.seconds
      });
    }
    else {
      resetState();
    }

    if (running) {
      setRunning(false);
      setPageTitle();
    }
  }

  function updateTitle(values) {
    if (isLastRunningTimer("timer")) {
      if (values) {
        const { hours, minutes, seconds } = values;

        setPageTitle(`${hours ? `${hours} h ` : ""}${minutes ? `${minutes} m ` : ""}${seconds} s${getAlarmIcon()}`);
      }
      else {
        setPageTitle();
      }
    }
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

  function updatePresetsModal(presets) {
    dispatchCustomEvent("fullscreen-modal", {
      component: Presets,
      params: { presets, updatePresets, resetActivePreset }
    });
  }

  function showPresets() {
    updatePresetsModal(presets);
  }

  function updatePresets(presets) {
    if (!presets.length) {
      setActivePreset(null);
    }
    setPresets([...presets]);
    savePresets(presets);
    updatePresetsModal(presets);
  }

  function resetState() {
    setState({
      hours: "00",
      minutes: "00",
      seconds: "00"
    });
  }

  function resetActivePreset(preset) {
    if (activePreset?.id === preset.id) {
      setActivePreset({ ...preset });
      setState({
        hours: preset.hours,
        minutes: preset.minutes,
        seconds: preset.seconds
      });
    }
  }

  function disableActivePreset() {
    if (activePreset) {
      setActivePreset(null);
    }
  }

  function savePresets(presets) {
    chromeStorage.set({ timer: presets });
  }

  function handlePresetSelection(id) {
    if (activePreset?.id === id) {
      return;
    }
    const preset = presets.find(preset => preset.id === id);

    setActivePreset(preset || null);

    if (preset) {
      const { timer: { usePresetNameAsLabel } } = getSetting("timers");

      if (usePresetNameAsLabel) {
        setLabel(preset.name);
      }
      setState({
        hours: preset.hours,
        minutes: preset.minutes,
        seconds: preset.seconds
      });
    }
    else {
      resetState();
    }
  }

  function handleLabelInputChange(event) {
    setLabel(event.target.value);
  }

  return (
    <div className={`top-panel-item timer${visible ? " visible" : ""}`}>
      <div className="top-panel-item-content">
        {running ? (
          <>
            {label ? <h4 className="top-panel-item-content-label">{label}</h4> : null}
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
          </>
        ) : (
          <>
            <div className="top-panel-item-content-top">
              <input type="text" className="input" placeholder="Label" autoComplete="off" value={label} onChange={handleLabelInputChange}/>
              <Dropdown
                container={{ className: "top-panel-item-content-top-dropdown" }}
                toggle={{ isIconTextBtn: true, title: "Presets", iconId: "menu" }}>
                <div className="dropdown-group">
                  {presets.length ? (
                    presets.map(preset => (
                      <button className={`btn text-btn dropdown-btn timer-dropdown-presets-item${activePreset?.id === preset.id ? " active" : ""}`} key={preset.id}
                        onClick={() => handlePresetSelection(preset.id)}>{preset.name}</button>
                    ))
                  ) : (
                    <p className="timer-dropdown-presets-message">No presets</p>
                  )}
                </div>
                <button className="btn text-btn dropdown-btn" onClick={showPresets}>Manage</button>
              </Dropdown>
            </div>
            <Inputs state={state} setState={setState} handleKeyDown={disableActivePreset}/>
          </>
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
