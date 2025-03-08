import { useState, useEffect, useRef, lazy, type ChangeEvent } from "react";
import { dispatchCustomEvent } from "utils";
import { padTime } from "services/timeDate";
import { addToRunning, removeFromRunning } from "../running-timers";
import * as pipService from "../picture-in-picture";
import Icon from "components/Icon";
import "./stopwatch.css";
import useWorker from "../../useWorker";

const Splits = lazy(() => import("./Splits"));

type Props = {
  visible: boolean,
  locale: any,
  animDirection: "anim-left" | "anim-right",
  toggleIndicator: (name: string, visible: boolean) => void,
  updateTitle: (name: string, values?: { hours?: number, minutes?: string, seconds: string, isAudioEnabled?: boolean }) => void,
  expand: () => void,
}

export default function Stopwatch({ visible, locale, animDirection, toggleIndicator, updateTitle, expand }: Props) {
  const [running, setRunning] = useState(false);
  const [state, setState] = useState(() => getInitialState());
  const [splits, setSplits] = useState<{ elapsed: number, elapsedString: string, diffString: string }[]>([]);
  const [label, setLabel] = useState("");
  const [dirty, setDirty] = useState(false);
  const [pipVisible, setPipVisible] = useState(false);
  const pageVisible = useRef(true);
  const { initWorker, destroyWorkers } = useWorker(handleMessage, [splits.length]);
  const name = "stopwatch";

  useEffect(() => {
    init();

    function handlePageVisibilityChange() {
      if (document.hidden) {
        pageVisible.current = false;
      }
      else {
        pageVisible.current = true;
      }
    }

    document.addEventListener("visibilitychange", handlePageVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handlePageVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (running) {
      initWorker({ id: name, elapsed: state.elapsed });
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
    function handlePipClose({ detail }: CustomEvent) {
      if (detail === name) {
        setPipVisible(false);
      }
    }

    window.addEventListener("pip-close", handlePipClose);

    return () => {
      window.removeEventListener("pip-close", handlePipClose);
    };
  }, [pipVisible]);

  function handleMessage(event: MessageEvent) {
    update(event.data);
  }

  function init() {
    const data = JSON.parse(localStorage.getItem(name));

    if (data) {
      setSplits(data.splits);
      setLabel(data.label);

      delete data.splits;
      delete data.label;

      data.millisecondsDisplay = "00";

      setState(data);
      setDirty(true);
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
    setDirty(true);
    setRunning(true);
    updateTitle(name, { seconds: "00" });
  }

  function stop() {
    setRunning(false);
    updateTitle(name);
  }

  function update({ elapsed }: { elapsed: number }) {
    const { hours, minutes, seconds, milliseconds } = parseTime(elapsed);
    const newState = {
      hours,
      minutes,
      minutesDisplay: padTime(minutes, !!hours),
      secondsDisplay: padTime(seconds, !!(hours || minutes)),
      seconds,
      milliseconds,
      millisecondsDisplay: "",
      elapsed
    };

    if (newState.milliseconds < 20) {
      newState.millisecondsDisplay = "00";
      updateTitle(name, {
        hours: newState.hours,
        minutes: newState.hours || newState.minutes ? newState.minutesDisplay : "",
        seconds:  newState.secondsDisplay
      });
      localStorage.setItem(name, JSON.stringify({ ...newState, label, splits: splits.slice(0, 100) }));
    }
    else {
      const millisecondString = Math.floor(newState.milliseconds / 10);
      newState.millisecondsDisplay = padTime(millisecondString, newState.milliseconds < 100);
    }

    if (pageVisible.current) {
      setState(newState);
    }
    pipService.update(name, {
      hours: newState.hours,
      minutes: newState.minutesDisplay,
      seconds: newState.secondsDisplay,
      milliseconds: newState.millisecondsDisplay
    });
  }

  function reset() {
    setDirty(false);
    setState(getInitialState());
    setSplits([]);
    pipService.close(name);
    localStorage.removeItem(name);

    if (running) {
      stop();
    }
  }

  function getInitialState() {
    return {
      elapsed: 0,
      millisecondsDisplay: "00",
      secondsDisplay: "0",
      minutesDisplay: "",
      milliseconds: 0,
      seconds: 0,
      minutes: 0,
      hours: 0
    };
  }

  function makeSplit() {
    const split = {
      diffString: "",
      elapsed: state.elapsed,
      elapsedString: getSplitString(state.elapsed)
    };

    if (splits.length) {
      split.diffString = getSplitString(state.elapsed - splits[0].elapsed);
    }
    setSplits([split, ...splits]);
  }

  function getSplitString(milliseconds: number) {
    const split = parseTime(milliseconds);
    const minutesDisplay = padTime(split.minutes, !!split.hours);
    const secondsDisplay = padTime(split.seconds, !!(split.hours || split.minutes));
    const millisecondString = Math.floor(split.milliseconds / 10);
    const millisecondsDisplay = padTime(millisecondString, split.milliseconds < 100);

    return `${split.hours ? `${split.hours} ` : ""}${split.hours || split.minutes ? `${minutesDisplay} ` : ""}${secondsDisplay}.${millisecondsDisplay}`;
  }

  function parseTime(time: number) {
    const hours = Math.floor(time / 3600000);
    time %= 3600000;
    const minutes = Math.floor(time / 60000);
    time %= 60000;
    const seconds = Math.floor(time / 1000);
    time %= 1000;
    const milliseconds = time;

    return {
      hours,
      minutes,
      seconds,
      milliseconds
    };
  }

  function togglePip() {
    setPipVisible(!pipVisible);
    pipService.toggle({
      name,
      title: "Stopwatch",
      data: {
        hours: state.hours,
        minutes: state.minutesDisplay,
        seconds: state.secondsDisplay,
        milliseconds: state.millisecondsDisplay
      },
      toggle
    });
  }

  function handleLabelInputChange(event: ChangeEvent) {
    setLabel((event.target as HTMLInputElement).value);
  }

  function showSplits() {
    dispatchCustomEvent("fullscreen-modal", {
      id: "splits",
      shouldToggle: true,
      component: Splits,
      params: { splits, locale }
    });
  }

  return (
    <div className={`top-panel-item stopwatch${visible ? " visible" : ""}${splits.length ? " with-splits" : ""}${animDirection ? ` ${animDirection}` : ""}`}>
      <div className="container-body">
        {pipVisible ? <div className="top-panel-item-content">Picture-in-picture is active</div> : (
          <div className="top-panel-item-content">
            {running || dirty ?
              label ? (
                <h4 className="top-panel-item-content-label">{label}</h4>
              ) : null : (
                <div className="top-panel-item-content-top">
                  <input type="text" className="input" value={label} onChange={handleLabelInputChange} placeholder={locale.topPanel.label_input_placeholder} autoComplete="off"/>
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
                  <span className="top-panel-digit">{state.minutesDisplay}</span>
                  <span className="top-panel-digit-sep">m</span>
                </div>
              )}
              <div>
                <span className="top-panel-digit">{state.secondsDisplay}</span>
                <span className="top-panel-digit-sep">s</span>
              </div>
              <span className="stopwatch-milliseconds">{state.millisecondsDisplay}</span>
            </div>
            {splits.length ? (
              <div className="stopwatch-splits-preview">
                <button className="btn text-btn" onClick={showSplits} data-modal-initiator="true">{locale.stopwatch.splits_title}</button>
                <ul className="stopwatch-splits-preview-items">
                  {splits.slice(0, 6).map((split, index) => (
                    <li className="stopwatch-splits-preview-item" key={index}>
                      <span>#{splits.length - index}</span>
                      <span>{split.elapsedString}</span>
                      {split.diffString ? <span>{split.diffString}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </div>
      <div className="top-panel-hide-target container-footer top-panel-item-actions">
        <button className="btn text-btn top-panel-item-action-btn" onClick={toggle}>{running ? locale.topPanel.stop : locale.topPanel.start}</button>
        {running ? <button className="btn text-btn top-panel-item-action-btn" onClick={makeSplit}>{locale.stopwatch.split_button}</button> : null}
        {running || !dirty ? null : <button className="btn text-btn top-panel-item-action-btn" onClick={reset}>{locale.global.reset}</button>}
        <div className="top-panel-secondary-actions">
          {dirty && pipService.isSupported() && (
            <button className="btn icon-btn" onClick={togglePip} title="Toggle picture-in-picture">
              <Icon id="pip"/>
            </button>
          )}
          {running && (
            <button className="btn icon-btn" onClick={expand} title={locale.global.expand}>
              <Icon id="expand"/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
