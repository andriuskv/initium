import { useState, useEffect, useRef } from "react";
import { padTime } from "services/timeDate";
import { getSetting } from "services/settings";
import { addToRunning, removeFromRunning, isLastRunningTimer } from "../running-timers";
import Icon from "components/Icon";
import "./pomodoro.css";

const stagesOrder = ["focus", "short", "focus", "long"];
const stages = {
  focus: "Focus",
  short: "Short break",
  long: "Long break"
};

export default function Pomodoro({ visible, updateTitle, expand, handleReset }) {
  const [running, setRunning] = useState(false);
  const [state, setState] = useState(() => {
    const { pomodoro: { focus } } = getSetting("timers");
    return parseDuration(focus * 60);
  });
  const [stage, setStage] = useState("focus");
  const [label, setLabel] = useState("");
  const [audio, setAudio] = useState({ shouldPlay: true });
  const dirty = useRef(false);
  const currentStageIndex = useRef(0);
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

  useEffect(() => {
    if (running) {
      update(state.duration + 1, performance.now());
    }
    return () => {
      clearTimeout(timeoutId.current);
    };
  }, [stage]);

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

  function update(duration, elapsed) {
    const interval = 1000;
    const diff = performance.now() - elapsed;

    elapsed += interval;
    duration -= 1;

    const state = parseDuration(duration);

    setState(state);
    updateTitle("pomodoro", { ...state, isAudioEnabled: audio.shouldPlay });

    timeoutId.current = setTimeout(() => {
      if (duration > 0) {
        update(duration, elapsed);
      }
      else {
        if (audio.shouldPlay) {
          playAudio();
        }
        setNextStage();
      }
    }, interval - diff);
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
      <div className="top-panel-item-content pomodoro-content">
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
      <div className="top-panel-hide-target top-panel-item-actions">
        <button className="btn text-btn top-panel-item-action-btn" onClick={toggle}>{running ? "Stop": "Start"}</button>
        {running || !dirty.current ? null : <button className="btn text-btn top-panel-item-action-btn" onClick={reset}>Reset</button>}
        <div className="top-panel-secondary-actions">
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
