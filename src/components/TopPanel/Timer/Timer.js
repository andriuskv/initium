import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { setPageTitle } from "../../../utils";
import { padTime } from "services/timeDate";
import * as chromeStorage from "services/chromeStorage";
import { getSetting, updateSetting } from "services/settings";
import { addToRunning, removeFromRunning, isLastRunningTimer } from "../running-timers";
import Dropdown from "components/Dropdown";
import Icon from "components/Icon";
import "./timer.css";
import Inputs from "./Inputs";

const Presets = lazy(() => import("./Presets"));

export default function Timer({ visible, expand, exitFullscreen, handleReset }) {
  const [running, setRunning] = useState(false);
  const [state, setState] = useState({
    hours: "00",
    minutes: "00",
    seconds: "00"
  });
  const [presetsVisible, setPresetsVisible] = useState(false);
  const [presets, setPresets] = useState([]);
  const [activePreset, setActivePreset] = useState(null);
  const [alarm, setAlarm] = useState({ shouldRun: true });
  const [presetNameHidden, setPresetNameVisibility] = useState(() => {
    const { presetNameHidden } = getSetting("timer");
    return presetNameHidden ?? false;
  });
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

  function showPresets() {
    setPresetsVisible(true);
  }

  function hidePresets() {
    setPresetsVisible(false);
  }

  function updatePresets(presets) {
    if (!presets.length) {
      setActivePreset(null);
    }
    setPresets([...presets]);
    savePresets(presets);
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

  function handlePresetSelection({ target }) {
    const preset = presets.find(preset => preset.id === target.value);

    setActivePreset(preset || null);

    if (preset) {
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

  function togglePresetNameVisibility({ target }) {
    setPresetNameVisibility(target.checked);
    updateSetting({
      timer: {
        presetNameHidden: target.checked
      }
    });
  }
  return (
    <div className={`top-panel-item timer${visible ? " visible" : ""}`}>
      {presetsVisible ? (
        <Suspense fallback={null}>
          <Presets presets={presets} updatePresets={updatePresets} resetActivePreset={resetActivePreset} hide={hidePresets}/>
        </Suspense>
      ) : (
        <>
          <div className="top-panel-item-content timer-content">
            {running ? (
              <>
                {!presetNameHidden && activePreset ? <h4 className="timer-selected-preset-name">{activePreset.name}</h4> : null}
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
                {presets.length ? (
                  <div className="select-container timer-preset-select">
                    <select className="input select"
                      onChange={handlePresetSelection} value={activePreset?.id || ""} title="Presets">
                      <option value=""></option>
                      {presets.map(preset => (
                        <option value={preset.id} key={preset.id}>{preset.name}</option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <Inputs state={state} setState={setState} disableActivePreset={disableActivePreset}/>
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
                <>
                  <Dropdown>
                    <div className="dropdown-group">
                      <label className="checkbox-container timer-dropdown-setting">
                        <input type="checkbox" className="sr-only checkbox-input"
                          onChange={togglePresetNameVisibility}
                          checked={presetNameHidden}/>
                        <div className="checkbox">
                          <div className="checkbox-tick"></div>
                        </div>
                        <span className="label-right">Hide preset name</span>
                      </label>
                    </div>
                    <button className="btn icon-text-btn dropdown-btn" onClick={showPresets}>
                      <Icon id="menu"/>
                      <span>Presets</span>
                    </button>
                  </Dropdown>
                  <button className="btn icon-btn" onClick={toggleAlarm} title="Toggle alarm">
                    <Icon id={`bell${alarm.shouldRun ? "" : "-off"}`}/>
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
