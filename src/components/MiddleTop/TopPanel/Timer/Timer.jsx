import { useState, useEffect, useRef, lazy } from "react";
import { dispatchCustomEvent } from "utils";
import { padTime } from "services/timeDate";
import * as chromeStorage from "services/chromeStorage";
import { getSetting } from "services/settings";
import { addToRunning, removeFromRunning, isLastRunningTimer } from "../running-timers";
import * as pipService from "../picture-in-picture";
import Dropdown from "components/Dropdown";
import Icon from "components/Icon";
import "./timer.css";
import Inputs from "./Inputs";

const Presets = lazy(() => import("./Presets"));

export default function Timer({ visible, locale, toggleIndicator, updateTitle, expand, exitFullscreen, handleReset }) {
  const [running, setRunning] = useState(false);
  const [state, setState] = useState({
    hours: "00",
    minutes: "00",
    seconds: "00"
  });
  const [presets, setPresets] = useState([]);
  const [activePreset, setActivePreset] = useState(null);
  const [audio, setAudio] = useState({ shouldPlay: true });
  const [label, setLabel] = useState("");
  const [pipVisible, setPipVisible] = useState(false);
  const dirty = useRef(false);
  const dirtyInput = useRef(false);
  const worker = useRef(null);
  const audioTimeoutId = useRef(null);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (running) {
      initWorker(state.duration);
      toggleIndicator("timer", true);
      addToRunning("timer");
    }
    else {
      destroyWorker();
      toggleIndicator("timer", false);
      removeFromRunning("timer");
    }
    pipService.updateActions("timer", { toggle });

    return () => {
      destroyWorker();
    };
  }, [running]);

  useEffect(() => {
    window.addEventListener("pip-close", handlePipClose);

    return () => {
      window.removeEventListener("pip-close", handlePipClose);
    };
  }, [pipVisible]);

  function initWorker(duration) {
    if (worker.current) {
      return;
    }
    const controller = new AbortController();

    worker.current = {
      ref: new Worker(new URL("../worker.js", import.meta.url), { type: "module" }),
      abortController: controller
    };

    worker.current.ref.addEventListener("message", handleMessage, { signal: controller.signal });
    worker.current.ref.postMessage({ action: "start", duration });
  }

  function handleMessage({ data }) {
    if (data.duration >= 0) {
      update(data.duration);

      if (data.duration === 0 && audio.shouldPlay) {
        playAudio();
      }
    }
    else if (!audio.shouldPlay) {
      reset();
    }
  }

  function destroyWorker() {
    if (!worker.current) {
      return;
    }
    worker.current.abortController.abort();
    worker.current.ref.terminate();
    worker.current = null;
  }

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

      if (!audio.element) {
        setAudio({ ...audio, element: new Audio("./assets/alarm.mp3") });
      }
      dirty.current = true;
      dirtyInput.current = true;
      setRunning(true);
      setState({
        hours: values.hours,
        minutes: paddedMinutes,
        seconds: paddedSeconds,
        duration
      });
      updateTitle("timer", {
        hours: values.hours,
        minutes: values.hours || values.minutes ? paddedMinutes : "",
        seconds: paddedSeconds,
        isAudioEnabled: audio.shouldPlay
      });
    }
  }

  function stop() {
    setState({
      hours: padTime(state.hours),
      minutes: padTime(state.minutes),
      seconds: padTime(state.seconds)
    });
    setRunning(false);
    updateTitle("timer");
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

  function update(duration) {
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
    updateTitle("timer", {
      hours,
      minutes: hours || minutes ? paddedMinutes : "",
      seconds: paddedSeconds,
      isAudioEnabled: audio.shouldPlay
    });
    pipService.update("timer", {
      hours,
      minutes: paddedMinutes,
      seconds: paddedSeconds
    });
  }

  async function reset() {
    exitFullscreen();

    if (isLastRunningTimer("timer")) {
      await handleReset("timer");
    }
    dirty.current = false;
    dirtyInput.current = false;

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
      updateTitle("timer");
    }
    setPipVisible(false);
    pipService.close("timer");
  }

  function updateInputs(inputs) {
    dirtyInput.current = true;
    setState({ ...inputs });
  }

  function toggleAudio() {
    setAudio({ ...audio, shouldPlay: !audio.shouldPlay });
  }

  function playAudio() {
    const { volume } = getSetting("timers");

    audio.element.volume = volume;
    audio.element.play();

    setTimeout(() => {
      exitFullscreen();
      reset();
    }, 3000);
  }

  function updatePresetsModal(presets) {
    dispatchCustomEvent("fullscreen-modal", {
      component: Presets,
      params: { presets, locale, updatePresets, resetActivePreset }
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

  function togglePip() {
    setPipVisible(!pipVisible);
    pipService.toggle({ name: "timer", title: "Timer", data: state, toggle });
  }

  function handlePipClose({ detail }) {
    if (detail === "timer") {
      setPipVisible(false);
    }
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
      {pipVisible ? <div className="container-body top-panel-item-content">Picture-in-picture is active</div> : (
        <div className="container-body top-panel-item-content">
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
              {dirty.current ? label ? <h4 className="top-panel-item-content-label">{label}</h4> : null : (
                <div className="top-panel-item-content-top">
                  <input type="text" className="input" value={label} onChange={handleLabelInputChange}
                    placeholder={locale.topPanel.label_input_placeholder} autoComplete="off"/>
                  <Dropdown
                    container={{ className: "top-panel-item-content-top-dropdown" }}
                    toggle={{ isIconTextBtn: true, title: locale.timer.presets_button, iconId: "menu" }}>
                    <div className="dropdown-group timer-dropdown-presets">
                      {presets.length ? (
                        presets.map(preset => (
                          <button className={`btn text-btn dropdown-btn${activePreset?.id === preset.id ? " active" : ""}`} key={preset.id}
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
              <Inputs state={state} updateInputs={updateInputs} handleKeyDown={disableActivePreset}/>
            </>
          )}
        </div>
      )}
      <div className="top-panel-hide-target container-footer top-panel-item-actions">
        <button className="btn text-btn top-panel-item-action-btn" onClick={toggle}>{running ? locale.topPanel.stop : locale.topPanel.start}</button>
        {running || !dirtyInput.current ? null : <button className="btn text-btn top-panel-item-action-btn" onClick={reset}>{locale.global.reset}</button>}
        <div className="top-panel-secondary-actions">
          {dirty.current && pipService.isSupported() && (
            <button className="btn icon-btn" onClick={togglePip} title="Toggle picture-in-picture">
              <Icon id="pip"/>
            </button>
          )}
          {running ? (
            <button className="btn icon-btn" onClick={expand} title={locale.global.expand}>
              <Icon id="expand"/>
            </button>
          ) : (
            <button className="btn icon-btn" onClick={toggleAudio} title={audio.shouldPlay ? locale.topPanel.mute : locale.topPanel.unmute}>
              <Icon id={`bell${audio.shouldPlay ? "" : "-off"}`}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
