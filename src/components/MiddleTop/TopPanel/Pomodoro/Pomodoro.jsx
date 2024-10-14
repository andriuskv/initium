import { useState, useEffect, useRef } from "react";
import { padTime } from "services/timeDate";
import { getSetting } from "services/settings";
import { addToRunning, removeFromRunning } from "../running-timers";
import * as pipService from "../picture-in-picture";
import Icon from "components/Icon";
import "./pomodoro.css";
import useWorker from "../../useWorker";

const stagesOrder = ["focus", "short", "focus", "long"];
const stages = {
  focus: "Focus",
  short: "Short break",
  long: "Long break"
};

export default function Pomodoro({ visible, locale, animDirection, toggleIndicator, updateTitle, expand, handleReset }) {
  const [running, setRunning] = useState(false);
  const [state, setState] = useState(() => {
    const { pomodoro: { focus } } = getSetting("timers");
    return parseDuration(focus * 60);
  });
  const [stage, setStage] = useState("focus");
  const [label, setLabel] = useState("");
  const [audio, setAudio] = useState({ shouldPlay: true });
  const [pipVisible, setPipVisible] = useState(false);
  const dirty = useRef(false);
  const currentStageIndex = useRef(0);
  const { initWorker, destroyWorkers } = useWorker(handleMessage);
  const name = "pomodoro";

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (running) {
      initWorker({ id: name, duration: state.duration });
      toggleIndicator(name, true);
      addToRunning(name);
    }
    else {
      destroyWorkers();
      toggleIndicator(name, false);
      removeFromRunning(name);
    }
    pipService.updateActions(name, { toggle });

    return () => {
      destroyWorkers();
    };
  }, [running]);

  useEffect(() => {
    if (running) {
      initWorker({ id: name, duration: state.duration });
    }
    return () => {
      destroyWorkers();
    };
  }, [stage]);

  useEffect(() => {
    window.addEventListener("pip-close", handlePipClose);

    return () => {
      window.removeEventListener("pip-close", handlePipClose);
    };
  }, [pipVisible]);

  function handleMessage({ data }) {
    if (data.duration < 0) {
      setNextStage();
    }
    else {
      update(data.duration);

      if (data.duration === 0 && audio.shouldPlay) {
        playAudio();
      }
    }
  }

  function init() {
    const data = JSON.parse(localStorage.getItem(name));

    if (data) {
      dirty.current = true;
      currentStageIndex.current = data.stageIndex;

      setStage(data.stage);
      setAudio({ shouldPlay: data.isAudioEnabled });
      setLabel(data.label);
      setState(parseDuration(data.duration));
    }
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
    dirty.current = true;

    if (!audio.element) {
      setAudio({ ...audio, element: new Audio("./assets/chime.mp3") });
    }
    setRunning(true);
    updateTitle(name, { ...state, isAudioEnabled: audio.shouldPlay });
  }

  function stop() {
    setRunning(false);
    updateTitle(name);
  }

  function update(duration) {
    const state = parseDuration(duration);

    setState(state);
    updateTitle(name, { ...state, isAudioEnabled: audio.shouldPlay });
    pipService.update(name, {
      hours: state.hours,
      minutes: state.minutes,
      seconds: state.seconds
    });
    localStorage.setItem(name, JSON.stringify({
      duration,
      stage,
      label,
      isAudioEnabled: audio.shouldPlay,
      stageIndex: currentStageIndex.current
    }));
  }

  async function reset() {
    await handleReset(name);
    removeFromRunning(name);
    dirty.current = false;
    currentStageIndex.current = 0;

    setStage("focus");
    resetTimer("focus");

    if (running) {
      setRunning(false);
      updateTitle(name);
    }
    pipService.close(name);
    localStorage.removeItem(name);
  }

  function setNextStage() {
    let nextStage = "";
    currentStageIndex.current += 1;

    if (currentStageIndex.current >= stagesOrder.length) {
      nextStage = stagesOrder[0];
      currentStageIndex.current = 0;
    }
    else {
      nextStage = stagesOrder[currentStageIndex.current];
    }
    setStage(nextStage);
    resetTimer(nextStage);
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

  function toggleAudio() {
    setAudio({ ...audio, shouldPlay: !audio.shouldPlay });
  }

  function playAudio() {
    const { volume } = getSetting("timers");

    audio.element.volume = volume;
    audio.element.play();
  }

  function togglePip() {
    setPipVisible(!pipVisible);
    pipService.toggle({
      name,
      title: "Pomodoro",
      data: {
        hours: state.hours,
        minutes: state.minutes,
        seconds: state.seconds
      },
      toggle
    });
  }

  function handlePipClose({ detail }) {
    if (detail === name) {
      setPipVisible(false);
    }
  }

  function handleLabelInputChange(event) {
    setLabel(event.target.value);
  }

  function renderTop() {
    if (running || dirty.current) {
      if (label) {
        return (
          <h4 className="top-panel-item-content-label pomodoro-label">
            <div>{label}</div>
            <div className="pomodoro-stage">{stages[stage]}</div>
          </h4>
        );
      }
      return <h4 className="top-panel-item-content-label pomodoro-stage">{stages[stage]}</h4>;
    }
    return (
      <div className="top-panel-item-content-top">
        <input type="text" className="input" value={label} onChange={handleLabelInputChange}
          placeholder={locale.topPanel.label_input_placeholder} autoComplete="off"/>
      </div>
    );
  }

  return (
    <div className={`top-panel-item pomodoro${visible ? " visible" : ""}${animDirection ? ` ${animDirection}` : ""}`}>
      <div className="container-body">
        {pipVisible ? <div className="top-panel-item-content">Picture-in-picture is active</div> : (
          <div className="top-panel-item-content">
            {renderTop()}
            <div className="top-panel-item-display">
              {state.hours > 0 && (
                <div>
                  <span className="top-panel-digit">{state.hours}</span>
                  <span className="top-panel-digit-sep">h</span>
                </div>
              )}
              {(state.hours > 0 || state.minutes > 0) && (
                <div>
                  <span className="top-panel-digit">{state.minutes}</span>
                  <span className="top-panel-digit-sep">m</span>
                </div>
              )}
              <div>
                <span className="top-panel-digit">{state.seconds}</span>
                <span className="top-panel-digit-sep">s</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="top-panel-hide-target container-footer top-panel-item-actions">
        <button className="btn text-btn top-panel-item-action-btn" onClick={toggle}>{running ? locale.topPanel.stop : locale.topPanel.start}</button>
        {running || !dirty.current ? null : <button className="btn text-btn top-panel-item-action-btn" onClick={reset}>{locale.global.reset}</button>}
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
