import { useState, useEffect, useRef, lazy } from "react";
import { dispatchCustomEvent } from "utils";
import { padTime } from "services/timeDate";
import { addToRunning, removeFromRunning } from "../running-timers";
import * as pipService from "../picture-in-picture";
import Icon from "components/Icon";
import "./stopwatch.css";
import useWorker from "../../useWorker";

const Splits = lazy(() => import("./Splits"));

export default function Stopwatch({ visible, locale, animDirection, toggleIndicator, updateTitle, expand }) {
  const [running, setRunning] = useState(false);
  const [state, setState] = useState(() => getInitialState());
  const [splits, setSplits] = useState([]);
  const [label, setLabel] = useState("");
  const [pipVisible, setPipVisible] = useState(false);
  const dirty = useRef(false);
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
    window.addEventListener("pip-close", handlePipClose);

    return () => {
      window.removeEventListener("pip-close", handlePipClose);
    };
  }, [pipVisible]);

  function handleMessage(event) {
    update(event.data);
  }

  function init() {
    const data = JSON.parse(localStorage.getItem(name));

    if (data) {
      dirty.current = true;

      setSplits(data.splits);
      setLabel(data.label);

      delete data.splits;
      delete data.label;

      data.millisecondsDisplay = "00";

      setState(data);
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
    setRunning(true);
    updateTitle(name, { minutes: "0", seconds: "00" });
  }

  function stop() {
    setRunning(false);
    updateTitle(name);
  }

  function update({ elapsed }) {
    const { hours, minutes, seconds, milliseconds } = parseTime(elapsed);
    const newState = {
      hours,
      minutes,
      minutesDisplay: padTime(minutes, hours),
      secondsDisplay: padTime(seconds, hours || minutes),
      milliseconds,
      elapsed
    };

    if (newState.milliseconds === 0) {
      newState.millisecondsDisplay = "00";
      updateTitle(name, { hours: newState.hours, minutes: newState.minutesDisplay, seconds: newState.secondsDisplay });
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
    dirty.current = false;
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
      milliseconds: 0,
      seconds: 0,
      minutes: 0,
      hours: 0
    };
  }

  function makeSplit() {
    const split = {
      elapsed: state.elapsed,
      elapsedString: getSplitString(state.elapsed)
    };

    if (splits.length) {
      split.diffString = getSplitString(state.elapsed - splits[0].elapsed);
    }
    setSplits([split, ...splits]);
  }

  function getSplitString(milliseconds) {
    const split = parseTime(milliseconds);
    const minutesDisplay = padTime(split.minutes, split.hours);
    const secondsDisplay = padTime(split.seconds, split.hours || split.minutes);
    const millisecondString = Math.floor(split.milliseconds / 10);
    const millisecondsDisplay = padTime(millisecondString, split.milliseconds < 100);

    return `${split.hours ? `${split.hours} ` : ""}${split.minutes ? `${minutesDisplay} ` : ""}${secondsDisplay}.${millisecondsDisplay}`;
  }

  function parseTime(time) {
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

  function handlePipClose({ detail }) {
    if (detail === name) {
      setPipVisible(false);
    }
  }

  function handleLabelInputChange(event) {
    setLabel(event.target.value);
  }

  function showSplits() {
    dispatchCustomEvent("fullscreen-modal", {
      id: "splits",
      shouldToggle: true,
      component: Splits,
      params: { splits, locale }
    });
  }

  function renderTop() {
    if (running || dirty.current) {
      if (label) {
        return <h4 className="top-panel-item-content-label">{label}</h4>;
      }
      return null;
    }
    return (
      <div className="top-panel-item-content-top">
        <input type="text" className="input" value={label} onChange={handleLabelInputChange} placeholder={locale.topPanel.label_input_placeholder} autoComplete="off"/>
      </div>
    );
  }

  return (
    <div className={`top-panel-item stopwatch${visible ? " visible" : ""}${splits.length ? " with-splits" : ""}${animDirection ? ` ${animDirection}` : ""}`}>
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
        {running || !dirty.current ? null : <button className="btn text-btn top-panel-item-action-btn" onClick={reset}>{locale.global.reset}</button>}
        <div className="top-panel-secondary-actions">
          {dirty.current && pipService.isSupported() && (
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
