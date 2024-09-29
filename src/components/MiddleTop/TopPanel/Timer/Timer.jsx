import { useState, useEffect, useRef, lazy } from "react";
import { timeout, getRandomString, dispatchCustomEvent } from "utils";
import { padTime } from "services/timeDate";
import * as chromeStorage from "services/chromeStorage";
import { getSetting } from "services/settings";
import { addToRunning, removeFromRunning } from "../running-timers";
import * as pipService from "../picture-in-picture";
import Dropdown from "components/Dropdown";
import Icon from "components/Icon";
import "./timer.css";
import Inputs from "./Inputs";
import useWorker from "../../useWorker";

const Presets = lazy(() => import("./Presets"));

export default function Timer({ visible, first, locale, toggleIndicator, updateTitle, ignoreMiniTimerPref, expand, exitFullscreen, handleReset }) {
  const [timers, setTimers] = useState(() => {
    const id = getRandomString(4);

    return {
      [id]: {
        id,
        label: "",
        active: true,
        running: false,
        shouldPlayAudio: true,
        presetId: null,
        hours: "00",
        minutes: "00",
        seconds: "00"
      }
    };
  });
  const [presets, setPresets] = useState([]);
  const [pipId, setPipId] = useState("");
  const [audioEnded, setAudioEnded] = useState([]);
  const audio = useRef({});
  const runningOrder = useRef([]);
  const saveTimeoutId = useRef();
  const { initWorker, destroyWorker, destroyWorkers, updateWorkerCallback, updateDuration } = useWorker(handleMessage);
  const timersArr = Object.values(timers);
  const activeTimer = timersArr.find(timer => timer.active) || timersArr[0];
  const shouldShowIndicator =
    runningOrder.current.length &&
    timersArr.length > 1 &&
    timersArr.some(timer => activeTimer.id !== timer.id && timer.running);

  useEffect(() => {
    init();

    return () => {
      destroyWorkers();
    };
  }, []);

  useEffect(() => {
    for (const { id } of timersArr) {
      updateWorkerCallback(id, handleMessage);
    }
    pipService.updateActions(`timer-${pipId}`, { toggle });
  }, [timersArr, pipId]);

  useEffect(() => {
    window.addEventListener("pip-close", handlePipClose);

    return () => {
      window.removeEventListener("pip-close", handlePipClose);
    };
  }, [pipId]);

  useEffect(() => {
    if (!audioEnded.length) {
      return;
    }
    for (const id of audioEnded) {
      resetAudio(id);
      reset(id);
    }
    setAudioEnded([]);
  }, [audioEnded]);

  function initTimer(params) {
    initWorker(params);
    toggleIndicator("timer", true);
    addToRunning(`timer-${params.id}`);
    ignoreMiniTimerPref("timer", false);
  }

  function resetTimer(id) {
    destroyWorker(id);

    if (timersArr.filter(timer => timer.running).length < 2) {
      toggleIndicator("timer", false);
      updateTitle("timer");
      exitFullscreen();
    }
    removeFromRunning(`timer-${id}`);
    ignoreMiniTimerPref("timer", timers[id].active);
  }

  function handleMessage({ data }) {
    const timer = timers[data.id];

    if (data.duration >= 0) {
      update(data.duration, data.id);

      if (data.duration === 0 && timer.shouldPlayAudio) {
        playAudio(timer.id);
      }
    }
    else if (!timer.shouldPlayAudio) {
      reset(timer.id);
    }
  }

  async function init() {
    const presets = await chromeStorage.get("timer") || [];
    const timers = JSON.parse(localStorage.getItem("timers")) || {};

    if (Object.keys(timers).length) {
      setTimers(timers);
    }
    setPresets(presets);

    chromeStorage.subscribeToChanges(({ timer }) => {
      if (!timer) {
        return;
      }

      if (timer.newValue) {
        setPresets(timer.newValue);
      }
      else {
        const id = getRandomString(4);

        setPresets([]);
        setTimers({
          [id]: {
            id,
            active: true,
            shouldPlayAudio: true,
            hours: "00",
            minutes: "00",
            seconds: "00"
          }
        });
      }
    });
  }

  function playAudio(id) {
    const { volume } = getSetting("timers");

    audio.current[id].element.volume = volume;
    audio.current[id].element.play();
    audio.current[id].timeoutId = setTimeout(() => {
      setAudioEnded([...audioEnded, id]);
    }, 3000);
  }

  function resetAudio(id) {
    audio.current[id].element.pause();
    audio.current[id].element.currentTime = 0;
    clearTimeout(audio.current[id].timeoutId);
    delete audio.current[id];
  }

  function toggle(pip) {
    const id = typeof pip === "boolean" && pip ? pipId : activeTimer.id;

    if (timers[id].running) {
      stop(pip);
    }
    else {
      start(pip);
    }
  }

  function start(pip) {
    const id = typeof pip === "boolean" && pip ? pipId : activeTimer.id;
    const timer = timers[id];
    const values = normalizeValues(timer);
    const duration = calculateDuration(values);

    if (duration) {
      const paddedMinutes = padTime(values.minutes, values.hours);
      const paddedSeconds = padTime(values.seconds, values.hours || values.minutes);

      initTimer({ id, duration });
      setTimers({ ...timers, [timer.id]: {
        ...timer,
        dirty: true,
        dirtyInput: true,
        running: true,
        hours: values.hours,
        minutes: paddedMinutes,
        seconds: paddedSeconds,
        duration
      }});

      if (runningOrder.current.length === 0) {
        updateTitle("timer", {
          hours: values.hours,
          minutes: values.hours || values.minutes ? paddedMinutes : "",
          seconds: paddedSeconds,
          isAudioEnabled: timer.shouldPlayAudio
        });
      }
      runningOrder.current.push(timer.id);

      if (timer.shouldPlayAudio && !audio.current[timer.id]) {
        audio.current[id] = {
          element: new Audio("./assets/alarm.mp3")
        };
      }
    }
  }

  function stop(pip) {
    const timer = typeof pip === "boolean" && pip ? timers[pipId] : activeTimer;
    const newTimer = {
      ...timer,
      running: false,
      hours: padTime(timer.hours),
      minutes: padTime(timer.minutes),
      seconds: padTime(timer.seconds)
    };

    if (audio.current[newTimer.id]?.timeoutId) {
      setAudioEnded([...audioEnded, newTimer.id]);
    }
    setTimers({ ...timers, [newTimer.id]: newTimer });
    resetTimer(newTimer.id);
    runningOrder.current = runningOrder.current.filter(id => newTimer.id !== id);
  }

  function normalizeValues(timer) {
    let hours = Number.parseInt(timer.hours, 10);
    let minutes = Number.parseInt(timer.minutes, 10);
    let seconds = Number.parseInt(timer.seconds, 10);

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

  function update(duration, id) {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor(duration / 60 % 60);
    const seconds = duration % 60;
    const paddedMinutes = padTime(minutes, hours);
    const paddedSeconds = padTime(seconds, hours || minutes);
    const timer = timers[id];
    const newTimers = { ...timers, [id]: {
      ...timer,
      hours,
      minutes: paddedMinutes,
      seconds: paddedSeconds
    }};

    setTimers(newTimers);

    if (runningOrder.current.at(-1) === id) {
      updateTitle("timer", {
        hours,
        minutes: hours || minutes ? paddedMinutes : "",
        seconds: paddedSeconds,
        isAudioEnabled: timer.shouldPlayAudio
      });
    }
    pipService.update(`timer-${id}`, {
      hours,
      minutes: paddedMinutes,
      seconds: paddedSeconds
    });

    saveTimers(newTimers);
  }

  async function reset(id) {
    if (activeTimer.id === id) {
      exitFullscreen();
    }
    await handleReset("timer");

    const timer = timers[id];
    let inputs = {
      hours: "00",
      minutes: "00",
      seconds: "00"
    };

    if (timer.presetId) {
      const preset = findPreset(timer.presetId);
      inputs = {
        hours: preset.hours,
        minutes: preset.minutes,
        seconds: preset.seconds
      };
    }

    if (timer.running) {
      resetTimer(id);
    }
    const newTimers = { ...timers, [timer.id] : {
      ...timer,
      ...inputs,
      dirty: false,
      dirtyInput: false,
      running: false
    }};
    runningOrder.current = runningOrder.current.filter(timerId => timerId !== id);
    setTimers(newTimers);
    setPipId("");
    pipService.close(`timer-${id}`);
    saveTimers(newTimers);
  }

  function saveTimers(timers) {
    const obj = {};

    for (const timer of Object.values(timers)) {
      obj[timer.id] = {
        id: timer.id,
        hours: padTime(timer.hours),
        minutes: padTime(timer.minutes),
        seconds: padTime(timer.seconds),
        label: timer.label,
        active: timer.active,
        dirty: timer.dirty,
        dirtyInput: timer.dirtyInput,
        presetId: timer.presetId || "",
        shouldPlayAudio: timer.shouldPlayAudio
      };
    }
    localStorage.setItem("timers", JSON.stringify(obj));
  }

  function updateInputs(inputs) {
    setTimers({ ...timers, [activeTimer.id]: {
      ...activeTimer,
      ...inputs,
      dirtyInput: true
    }});

    if (pipId) {
      const hours = Number.parseInt(inputs.hours, 10);
      const minutes = Number.parseInt(inputs.minutes, 10);

      pipService.update(`timer-${activeTimer.id}`, {
        hours,
        minutes: padTime(minutes, hours),
        seconds: padTime(inputs.seconds, hours || minutes)
      });
    }
  }

  function toggleAudio() {
    setTimers({ ...timers, [activeTimer.id]: {
      ...activeTimer,
      shouldPlayAudio: !activeTimer.shouldPlayAudio
    }});
  }

  function updatePresetsModal(presets) {
    dispatchCustomEvent("fullscreen-modal", {
      component: Presets,
      params: { presets, locale, updatePresets, getUpdatedTime, resetActivePreset }
    });
  }

  function showPresets() {
    updatePresetsModal(presets);
  }

  function updatePresets(presets) {
    if (!presets.length) {
      setTimers({ ...timers, [activeTimer.id]: {
        ...activeTimer,
        presetId: ""
      }});
    }
    setPresets([...presets]);
    savePresets(presets);
    updatePresetsModal(presets);
  }

  function resetActivePreset(preset) {
    if (activeTimer.presetId === preset.id) {
      setTimers({ ...timers, [activeTimer.id]: {
        ...activeTimer,
        hours: preset.hours,
        minutes: preset.minutes,
        seconds: preset.seconds
      }});
    }
  }

  function disableActivePreset() {
    if (activeTimer.presetId) {
      setTimers({ ...timers, [activeTimer.id]: {
        ...activeTimer,
        presetId: ""
      }});
    }
  }

  function savePresets(presets) {
    chromeStorage.set({ timer: presets });
  }

  function togglePip() {
    if (pipId === activeTimer.id) {
      setPipId("");
    }
    else {
      setPipId(activeTimer.id);
    }
    pipService.toggle({
      name: `timer-${activeTimer.id}`,
      title: "Timer",
      data: {
        hours: activeTimer.hours,
        minutes: activeTimer.minutes,
        seconds: activeTimer.seconds
      },
      toggle
    });
  }

  function handlePipClose({ detail }) {
    if (detail.startsWith("timer")) {
      setPipId("");
    }
  }

  function findPreset(id) {
    return presets.find(preset => preset.id === id);
  }

  function handlePresetSelection(id) {
    if (activeTimer.presetId === id) {
      return;
    }
    const preset = findPreset(id);

    if (preset) {
      const { timer: { usePresetNameAsLabel } } = getSetting("timers");
      const newTimers = { ...timers, [activeTimer.id]: {
        ...activeTimer,
        hours: preset.hours,
        minutes: preset.minutes,
        seconds: preset.seconds,
        label: usePresetNameAsLabel ? preset.name : activeTimer.label,
        presetId: preset.id
      }};

      setTimers(newTimers);
      saveTimers(newTimers);
    }
  }

  function handleLabelInputChange(event) {
    const newTimers = { ...timers, [activeTimer.id]: {
      ...activeTimer,
      label: event.target.value
    }};

    setTimers(newTimers);
    saveTimeoutId.current = timeout(() => {
      saveTimers(newTimers);
    }, 400, saveTimeoutId.current);
  }

  function clearLabelInput() {
    const newTimers = { ...timers, [activeTimer.id]: {
      ...activeTimer,
      label: ""
    }};

    setTimers(newTimers);
    saveTimers(newTimers);
  }

  function removeTimer() {
    delete timers[activeTimer.id];
    const newTimers = toggleTimer(timers, Object.values(timers)[0].id, true);

    setTimers(newTimers);
    saveTimers(newTimers);
  }

  function addTimer() {
    const id = getRandomString(4);
    let newTimers = {
      ...timers,
      [id]: {
        id,
        label: "",
        active: true,
        running: false,
        shouldPlayAudio: true,
        preset: null,
        hours: "00",
        minutes: "00",
        seconds: "00"
      }
    };
    newTimers = toggleTimer(newTimers, activeTimer.id, false);

    setTimers(newTimers);
    saveTimers(newTimers);
  }

  function toggleTimer(timers, id, state) {
    return {
      ...timers,
      [id]: {
        ...timers[id],
        active: state
      }
    };
  }

  function selectTimer(timers, id) {
    const t1 = toggleTimer(timers, activeTimer.id, false);
    const t2 = toggleTimer(t1, id, true);

    return t2;
  }

  function selectTimerWithState(id) {
    if (activeTimer.id === id) {
      return;
    }
    const newTimers = selectTimer(timers, id);
    ignoreMiniTimerPref("timer", !newTimers[id].running);
    setTimers(newTimers);
    saveTimers(newTimers);
  }

  function updateTime(to, sign, event) {
    const values = getUpdatedTime(activeTimer, { to, sign, shouldPad: !activeTimer.running }, event);

    setTimers({ ...timers, [activeTimer.id]: { ...activeTimer, ...values }});

    if (activeTimer.running) {
      updateDuration(activeTimer.id, values.duration);
    }
  }

  function addTime(to, event) {
    updateTime(to, 1, event);
  }

  async function removeTime(to, event) {
    updateTime(to, -1, event);
  }

  function getUpdatedTime(initialValues, { to, sign, shouldPad = true }, event) {
    let amount = 1;

    if (event.ctrlKey) {
      amount = 5;
    }
    else if (event.shiftKey) {
      amount = 20;
    }
    else if (event.altKey) {
      amount = 60;
    }
    const val = Number.parseInt(initialValues[to], 10) + amount * sign;
    let { hours, minutes, seconds } = initialValues;

    if (to === "seconds") {
      if (val < 0) {
        if (hours > 0 || minutes > 0) {
          if (minutes > 0) {
            minutes -= 1;
            seconds = 60 + val;
          }
          else if (hours > 0) {
            hours -= 1;
            minutes = 59;
            seconds = 60 + val;
          }
        }
        else {
          seconds = 0;
        }
      }
      else {
        seconds = val;
      }
    }
    else if (to === "minutes") {
      if (val < 0) {
        if (hours > 0) {
          hours -= 1;
          minutes = 60 + val;
        }
        else {
          minutes = 0;
        }
      }
      else {
        minutes = val;
      }
    }
    else if (to === "hours") {
      if (val < 0) {
        hours = 0;
      }
      else {
        hours = val;
      }
    }
    const values = normalizeValues({ hours, minutes, seconds });

    return {
      hours: padTime(values.hours, shouldPad),
      minutes: padTime(values.minutes, shouldPad || values.hours),
      seconds: padTime(values.seconds, shouldPad || values.hours || values.minutes),
      duration: calculateDuration(values)
    };
  }

  return (
    <div className={`top-panel-item timer${visible ? " visible" : ""}${first ? " first" : ""}`}>
      {pipId === activeTimer.id ? <div className="container-body top-panel-item-content">Picture-in-picture is active</div> : (
        <div className="container-body top-panel-item-content">
          {activeTimer.running ? (
            <>
              {activeTimer.label ? <h4 className="top-panel-item-content-label">{activeTimer.label}</h4> : null}
              <div className="top-panel-item-display">
                {activeTimer.hours > 0 && (
                  <div className="timer-digit-container">
                    <div className="timer-digit-value-container">
                      <div className="timer-display-btns">
                        <button type="button" className="btn icon-btn" onClick={event => addTime("hours", event)} title="Increase">
                          <Icon id="plus" size="16px"/>
                        </button>
                        <button type="button" className="btn icon-btn" onClick={event => removeTime("hours", event)} title="Decrease">
                          <Icon id="minus" size="16px"/>
                        </button>
                      </div>
                      <span className="top-panel-digit">{activeTimer.hours}</span>
                    </div>
                    <span className="top-panel-digit-sep">h</span>
                  </div>
                )}
                {(activeTimer.hours > 0 || activeTimer.minutes > 0) && (
                  <div className="timer-digit-container">
                    <div className="timer-digit-value-container">
                      <div className="timer-display-btns">
                        <button type="button" className="btn icon-btn" onClick={event => addTime("minutes", event)} title="Increase">
                          <Icon id="plus" size="16px"/>
                        </button>
                        <button type="button" className="btn icon-btn" onClick={event => removeTime("minutes", event)} title="Decrease">
                          <Icon id="minus" size="16px"/>
                        </button>
                      </div>
                      <span className="top-panel-digit">{activeTimer.minutes}</span>
                    </div>
                    <span className="top-panel-digit-sep">m</span>
                  </div>
                )}
                <div className="timer-digit-container">
                  <div className="timer-digit-value-container">
                    <div className="timer-display-btns">
                      <button type="button" className="btn icon-btn" onClick={event => addTime("seconds", event)} title="Increase">
                        <Icon id="plus" size="16px"/>
                      </button>
                      <button type="button" className="btn icon-btn" onClick={event => removeTime("seconds", event)} title="Decrease">
                        <Icon id="minus" size="16px"/>
                      </button>
                    </div>
                    <span className="top-panel-digit">{activeTimer.seconds}</span>
                  </div>
                  <span className="top-panel-digit-sep">s</span>
                </div>
              </div>
            </>
          ) : (
            <>
              {activeTimer.dirty ? activeTimer.label ? <h4 className="top-panel-item-content-label">{activeTimer.label}</h4> : null : (
                <div className="top-panel-item-content-top">
                  <div className="input-icon-btn-container">
                    <input type="text" className="input" value={activeTimer.label} onChange={handleLabelInputChange}
                      placeholder={locale.topPanel.label_input_placeholder} autoComplete="off"/>
                    {activeTimer.label ? (
                      <button className="btn icon-btn" onClick={clearLabelInput} title="Clear">
                        <Icon id="cross"/>
                      </button>
                    ) : null}
                  </div>
                  <Dropdown
                    container={{ className: "top-panel-item-content-top-dropdown" }}
                    toggle={{ isIconTextBtn: true, title: locale.timer.presets_button, iconId: "menu" }}>
                    <div className="dropdown-group timer-dropdown-presets">
                      {presets.length ? (
                        presets.map(preset => (
                          <button className={`btn text-btn dropdown-btn${activeTimer.presetId === preset.id ? " active" : ""}`} key={preset.id}
                            onClick={() => handlePresetSelection(preset.id)}>{preset.name}</button>
                        ))
                      ) : (
                        <p className="timer-dropdown-presets-message">{locale.timer.no_presets_message}</p>
                      )}
                    </div>
                    <button className="btn text-btn dropdown-btn" onClick={showPresets}>{locale.timer.manage_presets_button}</button>
                  </Dropdown>
                </div>
              )}
              <Inputs state={activeTimer} addTime={addTime} removeTime={removeTime} updateInputs={updateInputs} handleKeyDown={disableActivePreset}/>
            </>
          )}
        </div>
      )}
      <div className="top-panel-hide-target container-footer top-panel-item-actions">
        <button className="btn text-btn top-panel-item-action-btn" onClick={toggle}>{activeTimer.running ? locale.topPanel.stop : locale.topPanel.start}</button>
        {activeTimer.running || !activeTimer.dirtyInput ? null : <button className="btn text-btn top-panel-item-action-btn" onClick={() => reset(activeTimer.id)}>{locale.global.reset}</button>}
        <div className="top-panel-secondary-actions">
          {activeTimer.dirty && pipService.isSupported() && (
            <button className="btn icon-btn" onClick={togglePip} title="Toggle picture-in-picture">
              <Icon id="pip"/>
            </button>
          )}
          {activeTimer.running ? (
            <button className="btn icon-btn" onClick={expand} title={locale.global.expand}>
              <Icon id="expand"/>
            </button>
          ) : (
            <button className="btn icon-btn" onClick={toggleAudio} title={activeTimer.shouldPlayAudio ? locale.topPanel.mute : locale.topPanel.unmute}>
              <Icon id={`bell${activeTimer.shouldPlayAudio ? "" : "-off"}`}/>
            </button>
          )}
          <Dropdown toggle={{ className: shouldShowIndicator ? "indicator" : "" }}>
            <div className="dropdown-group timer-dropdown-list">
              <button className="btn icon-text-btn dropdown-btn timer-dropdown-btn" onClick={addTimer}>
                <Icon id="plus"/>
                <span>New timer</span>
              </button>
            </div>
            <div className="dropdown-group timer-dropdown-list">
              {timersArr.map(timer => (
                <button className={`btn text-btn dropdown-btn timer-dropdown-btn${activeTimer.id === timer.id ? " active" : ""}`} key={timer.id}
                  onClick={() => selectTimerWithState(timer.id)}>{timer.running ? <span className="timer-dropdown-indicator"></span> : null}{padTime(timer.hours)}:{padTime(timer.minutes)}:{padTime(timer.seconds)}</button>
              ))}
            </div>
            {timersArr.length > 1 && !activeTimer.running ? (
              <button className="btn icon-text-btn dropdown-btn timer-dropdown-btn" onClick={removeTimer}>
                <Icon id="trash"/>
                <span>Remove timer</span>
              </button>
            ) : null}
          </Dropdown>
        </div>
      </div>
    </div>
  );
}
