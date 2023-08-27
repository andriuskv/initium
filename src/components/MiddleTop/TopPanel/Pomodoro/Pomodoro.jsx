import { useState, useEffect, useRef } from "react";
import { padTime } from "services/timeDate";
import { getSetting } from "services/settings";
import { addToRunning, removeFromRunning, isLastRunningTimer } from "../running-timers";
import * as pipService from "../picture-in-picture";
import Icon from "components/Icon";
import "./pomodoro.css";

const stagesOrder = ["focus", "short", "focus", "long"];
const stages = {
  focus: "Focus",
  short: "Short break",
  long: "Long break"
};

export default function Pomodoro({ visible, toggleIndicator, updateTitle, expand, handleReset }) {
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
  const worker = useRef(null);

  useEffect(() => {
    if (running) {
      initWorker(state.duration);
      toggleIndicator("pomodoro", true);
      addToRunning("pomodoro");
    }
    else {
      destroyWorker();
      toggleIndicator("pomodoro", false);
      removeFromRunning("pomodoro");
    }
    pipService.updateActions("pomodoro", { toggle });

    return () => {
      destroyWorker();
    };
  }, [running]);

  useEffect(() => {
    if (running) {
      initWorker(state.duration);
    }
    return () => {
      destroyWorker();
    };
  }, [stage]);

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
    update(data.duration);

    if (data.duration <= 0) {
      if (audio.shouldPlay) {
        playAudio();
      }
      setNextStage();
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
    updateTitle("pomodoro", { ...state, isAudioEnabled: audio.shouldPlay });
  }

  function stop() {
    setRunning(false);
    updateTitle("pomodoro");
  }

  function update(duration) {
    const state = parseDuration(duration);

    setState(state);
    updateTitle("pomodoro", { ...state, isAudioEnabled: audio.shouldPlay });
    pipService.update("pomodoro", {
      hours: state.hours,
      minutes: state.minutes,
      seconds: state.seconds
    });
  }

  async function reset() {
    if (isLastRunningTimer("pomodoro")) {
      await handleReset("pomodoro");
    }
    dirty.current = false;
    currentStageIndex.current = 0;
    resetTimer(stage);

    if (running) {
      setRunning(false);
      updateTitle("pomodoro");
    }
    pipService.close("pomodoro");
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

    setTimeout(() => {
      setStage(nextStage);
      resetTimer(nextStage);
    }, 1000);
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
      name: "pomodoro",
      title: "Pomodoro",
      data: {
        hours: state.hours,
        minutes: state.minutes,
        seconds: state.seconds
      }, toggle
    });
  }

  function handlePipClose({ detail }) {
    if (detail === "pomodoro") {
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
        <input type="text" className="input" placeholder="Label" autoComplete="off" value={label} onChange={handleLabelInputChange}/>
      </div>
    );
  }

  return (
    <div className={`top-panel-item pomodoro${visible ? " visible" : ""}`}>
      {pipVisible ? <div className="container-body top-panel-item-content">Picture-in-picture is active</div> : (
        <div className="container-body top-panel-item-content pomodoro-content">
          <div className="pomodoro">
            {renderTop()}
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
        </div>
      )}
      <div className="top-panel-hide-target container-footer top-panel-item-actions">
        <button className="btn text-btn top-panel-item-action-btn" onClick={toggle}>{running ? "Stop": "Start"}</button>
        {running || !dirty.current ? null : <button className="btn text-btn top-panel-item-action-btn" onClick={reset}>Reset</button>}
        <div className="top-panel-secondary-actions">
          {dirty.current && pipService.isSupported() && (
            <button className="btn icon-btn" onClick={togglePip} title="Toggle picture-in-picture">
              <Icon id="pip"/>
            </button>
          )}
          {running ? (
            <button className="btn icon-btn" onClick={expand} title="Expand">
              <Icon id="expand"/>
            </button>
          ) : (
            <button className="btn icon-btn" onClick={toggleAudio} title={`${audio.shouldPlay ? "Disable" : "Enable"} audio`}>
              <Icon id={`bell${audio.shouldPlay ? "" : "-off"}`}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
