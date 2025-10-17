import type { TabName } from "../top-panel.type";
import type { Preset, Time } from "./timer.type";
import { useState, useEffect, useRef, lazy, type ChangeEvent, type MouseEvent } from "react";
import { timeout, getRandomString, dispatchCustomEvent, getLocalStorageItem } from "utils";
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
import type { TimersSettings } from "types/settings";

const Presets = lazy(() => import("./Presets"));

type Props = {
  visible: boolean,
  locale: any,
  animDirection?: "anim-left" | "anim-right",
  expanded: boolean,
  toggleIndicator: (name: TabName, value: boolean) => void,
  updateTitle: (name: string, values?: { hours?: number, minutes?: string, seconds: string, isAudioEnabled: boolean }) => void,
  ignoreMiniTimerPref: (name: TabName, value: boolean) => void,
  expand: () => void,
  exitFullscreen: () => void,
  handleReset: (name: string) => Promise<unknown> | undefined
}

type TimerType = Time & {
  id: string,
  active: boolean,
  label?: string,
  running?: boolean,
  dirty?: boolean,
  dirtyInput?: boolean,
  presetId?: string,
  duration?: number,
  shouldPlayAudio: boolean,
}

type TimerObj = { [key: string]: TimerType };

export default function Timer({ visible, locale, animDirection, expanded, toggleIndicator, updateTitle, ignoreMiniTimerPref, expand, exitFullscreen, handleReset }: Props) {
  const [timers, setTimers] = useState<TimerObj>(() => {
    const id = getRandomString(4);

    return {
      [id]: {
        id,
        label: "",
        active: true,
        shouldPlayAudio: true,
        presetId: "",
        hours: "00",
        minutes: "00",
        seconds: "00"
      }
    };
  });
  const [presets, setPresets] = useState<Preset[]>([]);
  const [pipId, setPipId] = useState("");
  const [audioEnded, setAudioEnded] = useState<string[]>([]);
  const audio = useRef<{ [key: string]: { element: HTMLAudioElement, timeoutId?: number } }>({});
  const runningOrder = useRef<string[]>([]);
  const saveTimeoutId = useRef(0);
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
    function handlePipClose({ detail }: CustomEventInit) {
      if (detail.startsWith("timer")) {
        setPipId("");
      }
    }

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

  function initTimer(params: { id: string; duration: number }) {
    initWorker(params);
    toggleIndicator("timer", true);
    addToRunning(`timer-${params.id}`);
    ignoreMiniTimerPref("timer", false);
  }

  function resetTimer(id: string) {
    destroyWorker(id);

    if (timersArr.filter(timer => timer.running).length < 2) {
      toggleIndicator("timer", false);
      updateTitle("timer");

      if (expanded) {
        exitFullscreen();
      }
    }
    removeFromRunning(`timer-${id}`);
    ignoreMiniTimerPref("timer", timers[id].active);
  }

  function handleMessage({ data }: { data: { id: string; duration: number } }) {
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
    const timers = getLocalStorageItem<TimerObj>("timers") || {};

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

  function playAudio(id: string) {
    const { volume } = getSetting("timers") as TimersSettings;

    audio.current[id].element.volume = volume;
    audio.current[id].element.play();
    audio.current[id].timeoutId = window.setTimeout(() => {
      setAudioEnded([...audioEnded, id]);
    }, 3000);
  }

  function resetAudio(id: string) {
    audio.current[id].element.pause();
    audio.current[id].element.currentTime = 0;
    clearTimeout(audio.current[id].timeoutId);
    delete audio.current[id];
  }

  function toggle(pip?: boolean) {
    const id = typeof pip === "boolean" && pip ? pipId : activeTimer.id;

    if (timers[id].running) {
      stop(pip);
    }
    else {
      start(pip);
    }
  }

  function start(pip?: boolean) {
    const id = typeof pip === "boolean" && pip ? pipId : activeTimer.id;
    const timer = timers[id];
    const values = normalizeValues(timer);
    const duration = calculateDuration(values);

    if (duration) {
      const paddedMinutes = padTime(values.minutes, !!values.hours);
      const paddedSeconds = padTime(values.seconds, !!(values.hours || values.minutes));
      const { timer: { usePresetNameAsLabel } } = getSetting("timers") as TimersSettings;
      let label = timer.label;

      if (usePresetNameAsLabel && timer.presetId) {
        label = presets.find(preset => preset.id === timer.presetId)!.name;
      }
      initTimer({ id, duration });
      setTimers({
        ...timers,
        [timer.id]: {
          ...timer,
          label,
          dirty: true,
          dirtyInput: true,
          running: true,
          hours: values.hours.toString(),
          minutes: paddedMinutes,
          seconds: paddedSeconds,
          duration
        }
      });

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

  function stop(pip?: boolean) {
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

  function normalizeValues(time: Time) {
    let { hours, minutes, seconds } = convertTimeObjToNumber(time);

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

  function calculateDuration({ hours, minutes, seconds }: { hours: number, minutes: number, seconds: number }) {
    return seconds + (minutes * 60) + (hours * 3600);
  }

  function update(duration: number, id: string) {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor(duration / 60 % 60);
    const seconds = duration % 60;
    const paddedMinutes = padTime(minutes, !!hours);
    const paddedSeconds = padTime(seconds, !!(hours || minutes));
    const timer = timers[id];
    const newTimers = {
      ...timers,
      [id]: {
        ...timer,
        hours: hours.toString(),
        minutes: paddedMinutes,
        seconds: paddedSeconds
      }
    };

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

  async function reset(id: string) {
    if (activeTimer.id === id) {
      exitFullscreen();
    }
    await handleReset("timer");

    const timer = timers[id];
    let inputs: Time = {
      hours: "00",
      minutes: "00",
      seconds: "00"
    };

    if (timer.presetId) {
      const preset = findPreset(timer.presetId)!;
      inputs = {
        hours: preset.hours,
        minutes: preset.minutes,
        seconds: preset.seconds
      };
    }

    if (timer.running) {
      resetTimer(id);
    }
    const newTimers = {
      ...timers,
      [timer.id] : {
        ...timer,
        ...inputs,
        dirty: false,
        dirtyInput: false,
        running: false
      }
    };
    runningOrder.current = runningOrder.current.filter(timerId => timerId !== id);
    setTimers(newTimers);
    setPipId("");
    pipService.close(`timer-${id}`);
    saveTimers(newTimers);
  }

  function saveTimers(timers: TimerObj) {
    const obj: Partial<TimerObj> = {};

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

  function updateInputs(inputs: Time) {
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
        minutes: padTime(minutes, !!hours),
        seconds: padTime(inputs.seconds, !!(hours || minutes))
      });
    }
  }

  function toggleAudio() {
    setTimers({ ...timers, [activeTimer.id]: {
      ...activeTimer,
      shouldPlayAudio: !activeTimer.shouldPlayAudio
    }});
  }

  function showPresets() {
    dispatchCustomEvent("fullscreen-modal", {
      component: Presets,
      params: { presets, updatePresets, getUpdatedTime, resetActivePreset }
    });
  }

  function updatePresets(presets: Preset[]) {
    if (!presets.length) {
      setTimers({ ...timers, [activeTimer.id]: {
        ...activeTimer,
        presetId: ""
      }});
    }
    setPresets([...presets]);
  }

  function resetActivePreset(preset: Preset) {
    if (activeTimer.presetId === preset.id) {
      setTimers({
        ...timers,
        [activeTimer.id]: {
          ...activeTimer,
          hours: preset.hours,
          minutes: preset.minutes,
          seconds: preset.seconds
        }
      });
    }
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
      title: locale.topPanel.timer,
      data: {
        hours: activeTimer.hours,
        minutes: activeTimer.minutes,
        seconds: activeTimer.seconds
      },
      toggle
    });
  }

  function findPreset(id: string) {
    return presets.find(preset => preset.id === id);
  }

  function handlePresetSelection(id: string) {
    if (activeTimer.presetId === id) {
      return;
    }
    const preset = findPreset(id);

    if (preset) {
      const { timer: { usePresetNameAsLabel } } = getSetting("timers") as TimersSettings;
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

  function handleLabelInputChange(event: ChangeEvent) {
    const newTimers = { ...timers, [activeTimer.id]: {
      ...activeTimer,
      label: (event.target as HTMLInputElement).value
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
    const { [activeTimer.id]: _, ...newTimers } = timers;

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

  function toggleTimer(timers: TimerObj, id: string, state: boolean) {
    return {
      ...timers,
      [id]: {
        ...timers[id],
        active: state
      }
    };
  }

  function selectTimer(timers: TimerObj, id: string) {
    const t1 = toggleTimer(timers, activeTimer.id, false);
    const t2 = toggleTimer(t1, id, true);

    return t2;
  }

  function selectTimerWithState(id: string) {
    if (activeTimer.id === id) {
      return;
    }
    const newTimers = selectTimer(timers, id);

    ignoreMiniTimerPref("timer", !newTimers[id].running);
    setTimers(newTimers);
    saveTimers(newTimers);
  }

  function updateTime(to: "hours" | "minutes" | "seconds", sign: 1 | -1, event: MouseEvent) {
    const values = getUpdatedTime(activeTimer, { to, sign, shouldPad: !activeTimer.running }, event);

    setTimers({ ...timers, [activeTimer.id]: { ...activeTimer, ...values }});

    if (activeTimer.running) {
      updateDuration(activeTimer.id, values.duration);
    }
  }

  function addTime(to: "hours" | "minutes" | "seconds", event: MouseEvent) {
    updateTime(to, 1, event);
  }

  async function removeTime(to: "hours" | "minutes" | "seconds", event: MouseEvent) {
    updateTime(to, -1, event);
  }

  function convertTimeObjToNumber(time: Time) {
    return {
      hours: Number.parseInt(time.hours, 10),
      minutes: Number.parseInt(time.minutes, 10),
      seconds: Number.parseInt(time.seconds, 10)
    };
  }

  function getUpdatedTime(initialValues: Time, { to, sign, shouldPad = true } : { to: "hours" | "minutes" | "seconds", sign: 1 | -1, shouldPad?: boolean }, event: MouseEvent) {
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
    const time = convertTimeObjToNumber(initialValues);
    const val = time[to] + amount * sign;
    let { hours, minutes, seconds } = time;

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
    const values = normalizeValues({
      hours: hours.toString(),
      minutes: minutes.toString(),
      seconds: seconds.toString()
    });

    return {
      hours: padTime(values.hours, shouldPad),
      minutes: padTime(values.minutes, shouldPad || !!values.hours),
      seconds: padTime(values.seconds, shouldPad || !!(values.hours || values.minutes)),
      duration: calculateDuration(values)
    };
  }

  const { hours, minutes } = convertTimeObjToNumber(activeTimer);

  return (
    <div className={`top-panel-item timer${visible ? " visible" : ""}${animDirection ? ` ${animDirection}` : ""}`}>
      <div className="container-body">
        {pipId === activeTimer.id ? <div className="top-panel-item-content">{locale.topPanel.pip_active}</div> : (
          <div className="top-panel-item-content">
            {activeTimer.running ? (
              <>
                {activeTimer.label ? <h4 className="top-panel-item-content-label">{activeTimer.label}</h4> : null}
                <div className="top-panel-item-display">
                  {hours > 0 && (
                    <div className="timer-digit-container">
                      <div className="timer-digit-value-container">
                        <div className="timer-display-btns">
                          <button type="button" className="btn icon-btn" onClick={event => addTime("hours", event)} title={locale.global.increase}>
                            <Icon id="plus" size="16px"/>
                          </button>
                          <button type="button" className="btn icon-btn" onClick={event => removeTime("hours", event)} title={locale.global.decrease}>
                            <Icon id="minus" size="16px"/>
                          </button>
                        </div>
                        <span className="top-panel-digit">{activeTimer.hours}</span>
                      </div>
                      <span className="top-panel-digit-sep">h</span>
                    </div>
                  )}
                  {(hours > 0 || minutes > 0) && (
                    <div className="timer-digit-container">
                      <div className="timer-digit-value-container">
                        <div className="timer-display-btns">
                          <button type="button" className="btn icon-btn" onClick={event => addTime("minutes", event)} title={locale.global.increase}>
                            <Icon id="plus" size="16px"/>
                          </button>
                          <button type="button" className="btn icon-btn" onClick={event => removeTime("minutes", event)} title={locale.global.decrease}>
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
                        <button type="button" className="btn icon-btn" onClick={event => addTime("seconds", event)} title={locale.global.increase}>
                          <Icon id="plus" size="16px"/>
                        </button>
                        <button type="button" className="btn icon-btn" onClick={event => removeTime("seconds", event)} title={locale.global.decrease}>
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
                        <button className="btn icon-btn" onClick={clearLabelInput} title={locale.global.clear}>
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
                            <button className={`btn text-btn dropdown-btn timer-dropdown-btn${activeTimer.presetId === preset.id ? " active" : ""}`} key={preset.id}
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
                <Inputs locale={locale} state={activeTimer} addTime={addTime} removeTime={removeTime} updateInputs={updateInputs}/>
              </>
            )}
          </div>
        )}
      </div>
      <div className="top-panel-hide-target container-footer top-panel-item-actions">
        <button className="btn text-btn top-panel-item-action-btn" onClick={() => toggle()}>{activeTimer.running ? locale.topPanel.stop : locale.topPanel.start}</button>
        {activeTimer.running || !activeTimer.dirtyInput ? null : <button className="btn text-btn top-panel-item-action-btn" onClick={() => reset(activeTimer.id)}>{locale.global.reset}</button>}
        <div className="top-panel-secondary-actions">
          {activeTimer.dirty && pipService.isSupported() && (
            <button className="btn icon-btn" onClick={togglePip} title={locale.topPanel.toggle_pip}>
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
                <span>{locale.timer.new_timer_btn}</span>
              </button>
            </div>
            <div className="dropdown-group timer-dropdown-list">
              {timersArr.map(timer => (
                <button className={`btn text-btn dropdown-btn timer-dropdown-btn${activeTimer.id === timer.id ? " active" : ""}`}
                  key={timer.id} onClick={() => selectTimerWithState(timer.id)}>
                  {timer.running ? <span className="timer-dropdown-indicator"></span> : null}
                  <div>
                    {timer.label ? <div className="timer-dropdown-label">{timer.label}</div> : null}
                    <div>{padTime(timer.hours)}:{padTime(timer.minutes)}:{padTime(timer.seconds)}</div>
                  </div>
                </button>
              ))}
            </div>
            {timersArr.length > 1 && !activeTimer.running ? (
              <button className="btn icon-text-btn dropdown-btn timer-dropdown-btn" onClick={removeTimer}>
                <Icon id="trash"/>
                <span>{locale.timer.remove_timer_btn}</span>
              </button>
            ) : null}
          </Dropdown>
        </div>
      </div>
    </div>
  );
}
