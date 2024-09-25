import { useRef } from "react";
import { padTime } from "services/timeDate";
import Icon from "components/Icon";

export default function Inputs({ state, addTime, removeTime, updateInputs, handleKeyDown: handleContainerKeyDown }) {
  const hoursInputRef = useRef(null);
  const minutesInputRef = useRef(null);
  const secondsInputRef = useRef(null);
  const selection = useRef(null);

  function handleChange({ target }) {
    const name = target.getAttribute("data-name");

    if (!target.value) {
      return;
    }
    else if (target.value.length > 2) {
      if (name === "seconds") {
        state.hours = state.hours[1] + state.minutes[0];
        state.minutes = state.minutes[1] + target.value[0];
      }
      else if (name === "minutes") {
        state.hours = state.hours[1] + target.value[0];
      }
      state[name] = padTime(target.value.slice(1));
    }
    else {
      state[name] = padTime(target.value);
    }
    updateInputs(state);
    requestAnimationFrame(() => {
      target.setSelectionRange(selection.current.end, selection.current.end);
    });
  }

  function handleKeyDown(event) {
    if (event.key.length === 1) {
      selection.current = { start: event.target.selectionStart, end: event.target.selectionEnd };

      if (event.ctrlKey || event.shiftKey) {
        return;
      }
      else if (/\D/.test(event.key)) {
        event.preventDefault();
      }
    }
    else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();

      const { target } = event;
      const { selectionStart, selectionEnd } = target;
      const name = target.getAttribute("data-name");

      if (name === "seconds") {
        if ((event.key === "Backspace" && selectionStart === selectionEnd) || selectionEnd - selectionStart === 1) {
          if (selectionEnd === 1) {
            state.seconds = state.minutes[1] + state.seconds[1];
          }
          else if (selectionEnd === 2) {
            state.seconds = state.minutes[1] + state.seconds[0];
          }
          state.minutes = state.hours[1] + state.minutes[0];
          state.hours = "0" + state.hours[0];
        }
        else if (event.key === "Delete" && selectionStart === selectionEnd) {
          if (selectionStart === 1) {
            state.seconds = state.seconds[0] + "0";
          }
          else if (selectionStart === 0) {
            state.seconds = state.seconds[1] + "0";
          }
        }
        else if (selectionEnd - selectionStart === 2) {
          state.seconds = state.minutes;
          state.minutes = state.hours;
          state.hours = "00";
        }
      }
      else if (name === "minutes") {
        if ((event.key === "Backspace" && selectionStart === selectionEnd) || selectionEnd - selectionStart === 1) {
          if (selectionEnd === 1) {
            state.minutes = state.hours[1] + state.minutes[1];
          }
          else if (selectionEnd === 2) {
            state.minutes = state.hours[1] + state.minutes[0];
          }
          state.hours = "0" + state.hours[0];
        }
        else if (event.key === "Delete" && selectionStart === selectionEnd) {
          if (selectionStart === 1) {
            state.minutes = state.minutes[0] + state.seconds[0];
          }
          else if (selectionStart === 0) {
            state.minutes = state.minutes[1] + state.seconds[0];
          }
          state.seconds = state.seconds[1] + "0";
        }
        else if (selectionEnd - selectionStart === 2) {
          state.minutes = state.hours;
          state.hours = "00";
        }
      }
      else if (name === "hours") {
        if ((event.key === "Backspace" && selectionStart === selectionEnd) || selectionEnd - selectionStart === 1) {
          if (selectionEnd === 1) {
            state.hours = "0" + state.hours[1];
          }
          else if (selectionEnd === 2) {
            state.hours = "0" + state.hours[0];
          }
        }
        else if (event.key === "Delete" && selectionStart === selectionEnd) {
          if (selectionStart === 1) {
            state.hours = state.hours[0] + state.minutes[0];
          }
          else if (selectionStart === 0) {
            state.hours = state.hours[1] + state.minutes[0];
          }
          state.minutes = state.minutes[1] + state.seconds[0];
          state.seconds = state.seconds[1] + "0";
        }
        else if (selectionEnd - selectionStart === 2) {
          state.hours = "00";
        }
      }
      updateInputs(state);
      requestAnimationFrame(() => {
        target.setSelectionRange(selectionEnd, selectionEnd);
      });
    }
    else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const { target } = event;
      const { selectionStart, selectionEnd } = target;

      if (selectionStart !== selectionEnd) {
        return;
      }
      const name = target.getAttribute("data-name");
      let element = null;
      let selection = 0;

      if (event.key === "ArrowLeft" && selectionStart === 0) {
        selection = 2;

        if (name === "seconds") {
          element = minutesInputRef.current;
        }
        else if (name === "minutes") {
          element = hoursInputRef.current;
        }
      }
      else if (event.key === "ArrowRight" && selectionStart === 2) {
        selection = 0;

        if (name === "minutes") {
          element = secondsInputRef.current;
        }
        else if (name === "hours") {
          element = minutesInputRef.current;
        }
      }

      if (element) {
        event.preventDefault();

        element.focus();
        element.setSelectionRange(selection, selection);
      }
    }
  }

  return (
    <div className="top-panel-item-display" onKeyDown={handleContainerKeyDown}>
      <div className="timer-digit-container">
        <div className="timer-digit-value-container">
          <div className="timer-display-btns">
            <button type="button" className="btn icon-btn" onClick={event => addTime("hours", event)} title="Increase">
              <Icon id="plus" size="16px"/>
            </button>
            <button type="button" className="btn icon-btn" onClick={event => removeTime("hours", event)} title="Decrease">
              <Icon id="minus" size="16px"/>
            </button>
          </div>
          <input type="text" className="top-panel-digit timer-input"
            onChange={handleChange} onKeyDown={handleKeyDown} value={state.hours} data-name="hours" ref={hoursInputRef}/>
        </div>
        <span className="top-panel-digit-sep">h</span>
      </div>
      <div className="timer-digit-container">
        <div className="timer-digit-value-container">
          <div className="timer-display-btns">
            <button type="button" className="btn icon-btn" onClick={event => addTime("minutes", event)} title="Increase">
              <Icon id="plus" size="16px"/>
            </button>
            <button type="button" className="btn icon-btn" onClick={event => removeTime("minutes", event)} title="Decrease">
              <Icon id="minus" size="16px"/>
            </button>
          </div>
          <input type="text" className="top-panel-digit timer-input"
            onChange={handleChange} onKeyDown={handleKeyDown} value={state.minutes} data-name="minutes" ref={minutesInputRef}/>
        </div>
        <span className="top-panel-digit-sep">m</span>
      </div>
      <div className="timer-digit-container">
        <div className="timer-digit-value-container">
          <div className="timer-display-btns">
            <button type="button" className="btn icon-btn" onClick={event => addTime("seconds", event)} title="Increase">
              <Icon id="plus" size="16px"/>
            </button>
            <button type="button" className="btn icon-btn" onClick={event => removeTime("seconds", event)} title="Decrease">
              <Icon id="minus" size="16px"/>
            </button>
          </div>
          <input type="text" className="top-panel-digit timer-input"
            onChange={handleChange} onKeyDown={handleKeyDown} value={state.seconds} data-name="seconds" ref={secondsInputRef}/>
        </div>
        <span className="top-panel-digit-sep">s</span>
      </div>
    </div>
  );
}
