import { useState, useEffect, useRef } from "react";
import { padTime } from "services/timeDate";
import Icon from "components/Icon";

export default function Stopwatch({ visible, expand }) {
  const [running, setRunning] = useState(false);
  const [state, setState] = useState(() => getInitialState());
  const animationId = useRef(0);

  useEffect(() => {
    if (running) {
      animationId.current = requestAnimationFrame(() => {
        update(performance.now());
      });
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
    setRunning(true);
  }

  function stop() {
    cancelAnimationFrame(animationId.current);
    setRunning(false);
  }

  function update(elapsed) {
    const diff = performance.now() - elapsed;
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
    }
    state.millisecondsDisplay = padTime(Math.floor(state.milliseconds).toString().slice(0, 2));

    setState({ ...state });
    animationId.current = requestAnimationFrame(() => {
      update(elapsed + diff);
    });
  }

  function reset() {
    setState(getInitialState());

    if (running) {
      stop();
    }
  }

  function getInitialState() {
    return {
      millisecondsDisplay: "00",
      secondsDisplay: "0",
      milliseconds: 0,
      seconds: 0,
      minutes: 0,
      hours: 0
    };
  }

  return (
    <div className={`top-panel-item${visible ? " visible" : ""}`}>
      <div className="top-panel-item-content">
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
      </div>
      <div className="top-panel-hide-target top-panel-item-actions">
        <button className="btn text-btn top-panel-item-action-btn" onClick={toggle}>{running ? "Stop": "Start"}</button>
        <button className="btn text-btn top-panel-item-action-btn" onClick={reset}>Reset</button>
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
