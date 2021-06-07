import { useRef } from "react";
import { padTime } from "services/timeDate";

export default function Inputs({ state, setState, disableActivePreset }) {
  const hourInputRef = useRef(null);
  const minuteInputRef = useRef(null);

  function handleChange({ target }) {
    const name = target.getAttribute("data-name");
    const pos = target.selectionStart - 1;

    // If input value does not contain numeric value, when reset it to previous value
    if (/\D/.test(target.value)) {
      target.value = state[name];
      target.selectionEnd = pos;
      return;
    }
    else if (!target.value) {
      target.value = "00";
    }
    else if (target.value.length > 2) {
      if (name === "seconds") {
        state.hours = hourInputRef.current.value[1] + minuteInputRef.current.value[0];
        state.minutes = minuteInputRef.current.value[1] + target.value[0];
      }
      else if (name === "minutes") {
        state.hours = hourInputRef.current.value[1] + target.value[0];
      }
      target.value = padTime(target.value.slice(1));
      target.selectionEnd = pos;
    }
    else {
      target.value = padTime(target.value);
    }
    setState({
      ...state,
      [name]: target.value
    });
  }

  return (
    <div className="timer-input-container" onChange={disableActivePreset}>
      <input type="text" className="top-panel-digit timer-input"
        onChange={handleChange} value={state.hours} data-name="hours" ref={hourInputRef}/>
      <span className="top-panel-digit-sep">h</span>
      <input type="text" className="top-panel-digit timer-input"
        onChange={handleChange} value={state.minutes} data-name="minutes" ref={minuteInputRef}/>
      <span className="top-panel-digit-sep">m</span>
      <input type="text" className="top-panel-digit timer-input"
        onChange={handleChange} value={state.seconds} data-name="seconds"/>
      <span className="top-panel-digit-sep">s</span>
    </div>
  );
}
