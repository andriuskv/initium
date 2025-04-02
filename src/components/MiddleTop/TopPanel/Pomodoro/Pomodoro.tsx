import type { TabName } from "../top-panel-types";
import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { padTime } from "services/timeDate";
import { getSetting } from "services/settings";
import { addToRunning, removeFromRunning } from "../running-timers";
import * as pipService from "../picture-in-picture";
import Icon from "components/Icon";
import "./pomodoro.css";
import useWorker from "../../useWorker";
import type { TimersSettings } from "types/settings";
import { getLocalStorageItem } from "utils";

type Props = {
  visible: boolean,
  locale: any,
  animDirection?: "anim-left" | "anim-right",
  toggleIndicator: (name: TabName, value: boolean) => void,
  updateTitle: (name: string, values?: { hours?: number, minutes?: string, seconds: string, isAudioEnabled: boolean }) => void,
  expand: () => void,
  exitFullscreen: () => void,
  handleReset: (name: string) => Promise<unknown> | undefined
}

type Stage = "focus" | "short" | "long";

const stagesOrder: Stage[] = ["focus", "short", "focus", "long"];
const stages = {
  focus: "Focus",
  short: "Short break",
  long: "Long break"
};

export default function Pomodoro({ visible, locale, animDirection, toggleIndicator, updateTitle, expand, handleReset }: Props) {
  const [running, setRunning] = useState(false);
  const [state, setState] = useState(() => {
    const { pomodoro: { focus } } = getSetting("timers") as TimersSettings;
    return {
      ...parseDuration(focus * 60),
      dirty: false
    };
  });
  const [stage, setStage] = useState<Stage>("focus");
  const [label, setLabel] = useState("");
  const [audio, setAudio] = useState<{ shouldPlay: boolean }>({ shouldPlay: true });
  const [pipVisible, setPipVisible] = useState(false);
  const currentStageIndex = useRef(0);
  const audioElement = useRef<HTMLAudioElement>(null);
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
    function handlePipClose({ detail }: CustomEventInit) {
      if (detail === name) {
        setPipVisible(false);
      }
    }

    window.addEventListener("pip-close", handlePipClose);

    return () => {
      window.removeEventListener("pip-close", handlePipClose);
    };
  }, [pipVisible]);

  function handleMessage({ data }: MessageEvent) {
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
    type Data = {
      duration: number,
      stage: Stage,
      stageIndex: number,
      label: string,
      isAudioEnabled: boolean
    }
    const data = getLocalStorageItem<Data>(name);

    if (data) {
      currentStageIndex.current = data.stageIndex;

      setStage(data.stage);
      setAudio({ shouldPlay: data.isAudioEnabled });
      setLabel(data.label);
      setState({
        ...parseDuration(data.duration),
        dirty: true
      });
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
    if (!audioElement.current) {
      audioElement.current = new Audio("./assets/chime.mp3");
    }
    setRunning(true);
    setState({ ...state, dirty: true });
    updateTitle(name, {
      ...state,
      hours: state.hours,
      minutes: state.hours || state.minutes ? state.minutesString : "",
      seconds: state.secondsString,
      isAudioEnabled: audio.shouldPlay
    });
  }

  function stop() {
    setRunning(false);
    updateTitle(name);
  }

  function update(duration: number) {
    const time = parseDuration(duration);

    setState({ ...state, ...time });
    updateTitle(name, {
      ...state,
      hours: time.hours,
      minutes: time.hours || time.minutes ? time.minutesString : "",
      seconds: time.secondsString,
      isAudioEnabled: audio.shouldPlay
    });
    pipService.update(name, {
      hours: time.hours,
      minutes: time.minutes,
      seconds: time.seconds
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
    let nextStage: Stage | "" = "";
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

  function resetTimer(stage: Stage) {
    const { pomodoro: settings } = getSetting("timers") as TimersSettings;
    const duration = settings[stage];

    setState({
      ...parseDuration(duration * 60),
      dirty: false
    });
  }

  function parseDuration(duration: number) {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor(duration / 60 % 60);
    const seconds = duration % 60;

    return {
      duration,
      hours,
      minutes,
      seconds,
      minutesString: padTime(minutes, !!(hours)),
      secondsString: padTime(seconds, !!(hours || minutes))
    };
  }

  function toggleAudio() {
    setAudio({ ...audio, shouldPlay: !audio.shouldPlay });
  }

  function playAudio() {
    const { volume } = getSetting("timers") as TimersSettings;

    if (audioElement.current) {
      audioElement.current.volume = volume;
      audioElement.current.play();
    }
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

  function handleLabelInputChange(event: ChangeEvent) {
    setLabel((event.target as HTMLInputElement).value);
  }

  return (
    <div className={`top-panel-item pomodoro${visible ? " visible" : ""}${animDirection ? ` ${animDirection}` : ""}`}>
      <div className="container-body">
        {pipVisible ? <div className="top-panel-item-content">Picture-in-picture is active</div> : (
          <div className="top-panel-item-content">
            {running || state.dirty ?
              label ? (
                <h4 className="top-panel-item-content-label pomodoro-label">
                  <div>{label}</div>
                  <div className="pomodoro-stage">{stages[stage]}</div>
                </h4>
              ) : <h4 className="top-panel-item-content-label pomodoro-stage">{stages[stage]}</h4> : (
                <div className="top-panel-item-content-top">
                  <input type="text" className="input" value={label} onChange={handleLabelInputChange}
                    placeholder={locale.topPanel.label_input_placeholder} autoComplete="off"/>
                </div>
              )}
            <div className="top-panel-item-display">
              {state.hours > 0 && (
                <div>
                  <span className="top-panel-digit">{state.hours}</span>
                  <span className="top-panel-digit-sep">h</span>
                </div>
              )}
              {(state.hours > 0 || state.minutes > 0) && (
                <div>
                  <span className="top-panel-digit">{state.minutesString}</span>
                  <span className="top-panel-digit-sep">m</span>
                </div>
              )}
              <div>
                <span className="top-panel-digit">{state.secondsString}</span>
                <span className="top-panel-digit-sep">s</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="top-panel-hide-target container-footer top-panel-item-actions">
        <button className="btn text-btn top-panel-item-action-btn" onClick={toggle}>{running ? locale.topPanel.stop : locale.topPanel.start}</button>
        {running || !state.dirty ? null : <button className="btn text-btn top-panel-item-action-btn" onClick={reset}>{locale.global.reset}</button>}
        <div className="top-panel-secondary-actions">
          {state.dirty && pipService.isSupported() && (
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
