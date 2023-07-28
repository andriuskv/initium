import { useState, useEffect, useRef } from "react";
import { padTime } from "services/timeDate";
import { addToRunning, removeFromRunning } from "../running-timers";
import Icon from "components/Icon";
import "./stopwatch.css";

export default function Stopwatch({ visible, toggleIndicator, updateTitle, expand }) {
  const [running, setRunning] = useState(false);
  const [state, setState] = useState(() => getInitialState());
  const [splits, setSplits] = useState([]);
  const [label, setLabel] = useState("");
  const dirty = useRef(false);
  const animationId = useRef(0);

  useEffect(() => {
    if (running) {
      animationId.current = requestAnimationFrame(() => {
        update(performance.now());
      });
      toggleIndicator("stopwatch", true);
      addToRunning("stopwatch");
    }
    else {
      toggleIndicator("stopwatch", false);
      removeFromRunning("stopwatch");
    }
    return () => {
      cancelAnimationFrame(animationId.current);
    };
  }, [running]);

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
    updateTitle("stopwatch", { minutes: "0", seconds: "00" });
  }

  function stop() {
    cancelAnimationFrame(animationId.current);
    setRunning(false);
    updateTitle("stopwatch");
  }

  function update(elapsed) {
    const diff = performance.now() - elapsed;
    state.elapsed = state.elapsed + diff;
    state.milliseconds += diff;

    if (state.milliseconds >= 1000) {
      state.milliseconds -= 1000;
      state.seconds += 1;

      if (state.seconds >= 60) {
        state.seconds -= 60;
        state.minutes += 1;
      }

      if (state.minutes >= 60) {
        state.minutes -= 60;
        state.hours += 1;
      }
      state.minutesDisplay = padTime(state.minutes, state.hours);
      state.secondsDisplay = padTime(state.seconds, state.minutes);

      updateTitle("stopwatch", { hours: state.hours, minutes: state.minutesDisplay, seconds: state.secondsDisplay });
    }
    const millisecondString = Math.floor(state.milliseconds).toString();
    state.millisecondsDisplay = state.milliseconds < 100 ? `0${millisecondString[0]}` : millisecondString.slice(0, 2);

    setState({ ...state });
    animationId.current = requestAnimationFrame(() => {
      update(elapsed + diff);
    });
  }

  function reset() {
    dirty.current = false;
    setState(getInitialState());
    setSplits([]);

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
    const split = parseSplitTime(milliseconds);
    const minutesDisplay = padTime(split.minutes, split.hours);
    const secondsDisplay = padTime(split.seconds, split.minutes);
    const millisecondString = Math.floor(split.milliseconds).toString();
    const millisecondsDisplay = split.milliseconds < 100 ? `0${millisecondString[0]}` : millisecondString.slice(0, 2);

    return `${split.hours ? `${split.hours} ` : ""}${split.minutes ? `${minutesDisplay} ` : ""}${secondsDisplay}.${millisecondsDisplay}`;
  }

  function parseSplitTime(diff) {
    const hours = Math.floor(diff / 3600000);
    diff %= 3600000;
    const minutes = Math.floor(diff / 60000);
    diff %= 60000;
    const seconds = Math.floor(diff / 1000);
    diff %= 1000;
    const milliseconds = diff;

    return {
      hours,
      minutes,
      seconds,
      milliseconds
    };
  }

  function handleLabelInputChange(event) {
    setLabel(event.target.value);
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
        <input type="text" className="input" placeholder="Label" autoComplete="off" value={label} onChange={handleLabelInputChange}/>
      </div>
    );
  }

  return (
    <div className={`top-panel-item stopwatch${visible ? " visible" : ""}${splits.length ? " with-splits" : ""}`}>
      <div className="top-panel-item-content">
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
              <span className="top-panel-digit">{state.minutesDisplay}</span>
              <span className="top-panel-digit-sep">m</span>
            </>
          )}
          <span className="top-panel-digit">{state.secondsDisplay}</span>
          <span className="top-panel-digit-sep">s</span>
          <span className="stopwatch-milliseconds">{state.millisecondsDisplay}</span>
        </div>
        {splits.length ? (
          <ul className="stopwatch-splits">
            {splits.map((split, index) => (
              <li className="stopwatch-split" key={index}>
                <span>#{splits.length - index}</span>
                <span>{split.elapsedString}</span>
                {split.diffString ? <span>{split.diffString}</span> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="top-panel-hide-target top-panel-item-actions">
        <button className="btn text-btn top-panel-item-action-btn" onClick={toggle}>{running ? "Stop": "Start"}</button>
        {running ? <button className="btn text-btn top-panel-item-action-btn" onClick={makeSplit}>Split</button> : null}
        {running || !dirty.current ? null : <button className="btn text-btn top-panel-item-action-btn" onClick={reset}>Reset</button>}
        <div className="top-panel-secondary-actions">
          {running && (
            <button className="btn icon-btn" onClick={expand} title="Expand">
              <Icon id="expand"/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
