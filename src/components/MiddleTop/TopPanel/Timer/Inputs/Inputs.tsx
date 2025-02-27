import type { Time } from "../timer.type";
import { useRef, type MouseEvent, type KeyboardEvent } from "react";
import { padTime } from "services/timeDate";
import Icon from "components/Icon";

type Props = {
  state: Time,
  addTime: (to: string, event: MouseEvent) => void,
  removeTime: (to: string, event: MouseEvent) => void,
  updateInputs: (newState: Time) => void,
  handleKeyDown?: (event: KeyboardEvent) => void,
};

export default function Inputs({ state, addTime, removeTime, updateInputs, handleKeyDown: handleContainerKeyDown = () => {} }: Props) {
  const hoursInputRef = useRef(null);
  const minutesInputRef = useRef(null);
  const secondsInputRef = useRef(null);
  const selection = useRef(null);

  function handleChange({ target }) {
    if (!target.value) {
      return;
    }
    const name = target.getAttribute("data-name");
    const inputs: Time = {
      hours: state.hours,
      minutes: state.minutes,
      seconds: state.seconds
    };

    if (target.value.length > 2) {
      if (name === "seconds") {
        inputs.hours = state.hours[1] + state.minutes[0];
        inputs.minutes = state.minutes[1] + target.value[0];
      }
      else if (name === "minutes") {
        inputs.hours = state.hours[1] + target.value[0];
      }
      inputs[name] = padTime(target.value.slice(1));
    }
    else {
      inputs[name] = padTime(target.value);
    }
    updateInputs(inputs);
    requestAnimationFrame(() => {
      target.setSelectionRange(selection.current.end, selection.current.end);
    });
  }

  function handleKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLInputElement;

    if (event.key.length === 1) {
      selection.current = { start: target.selectionStart, end: target.selectionEnd };

      if (event.ctrlKey || event.shiftKey) {
        return;
      }
      else if (/\D/.test(event.key)) {
        event.preventDefault();
      }
    }
    else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();

      const { selectionStart, selectionEnd } = target;
      const name = target.getAttribute("data-name");
      const inputs: Time = {
        hours: state.hours,
        minutes: state.minutes,
        seconds: state.seconds
      };

      if (name === "seconds") {
        if ((event.key === "Backspace" && selectionStart === selectionEnd) || selectionEnd - selectionStart === 1) {
          if (selectionEnd === 1) {
            inputs.seconds = state.minutes[1] + state.seconds[1];
          }
          else if (selectionEnd === 2) {
            inputs.seconds = state.minutes[1] + state.seconds[0];
          }
          inputs.minutes = state.hours[1] + state.minutes[0];
          inputs.hours = "0" + state.hours[0];
        }
        else if (event.key === "Delete" && selectionStart === selectionEnd) {
          if (selectionStart === 1) {
            inputs.seconds = state.seconds[0] + "0";
          }
          else if (selectionStart === 0) {
            inputs.seconds = state.seconds[1] + "0";
          }
        }
        else if (selectionEnd - selectionStart === 2) {
          inputs.seconds = state.minutes;
          inputs.minutes = state.hours;
          inputs.hours = "00";
        }
      }
      else if (name === "minutes") {
        if ((event.key === "Backspace" && selectionStart === selectionEnd) || selectionEnd - selectionStart === 1) {
          if (selectionEnd === 1) {
            inputs.minutes = state.hours[1] + state.minutes[1];
          }
          else if (selectionEnd === 2) {
            inputs.minutes = state.hours[1] + state.minutes[0];
          }
          inputs.hours = "0" + state.hours[0];
        }
        else if (event.key === "Delete" && selectionStart === selectionEnd) {
          if (selectionStart === 1) {
            inputs.minutes = state.minutes[0] + state.seconds[0];
          }
          else if (selectionStart === 0) {
            inputs.minutes = state.minutes[1] + state.seconds[0];
          }
          inputs.seconds = state.seconds[1] + "0";
        }
        else if (selectionEnd - selectionStart === 2) {
          inputs.minutes = state.hours;
          inputs.hours = "00";
        }
      }
      else if (name === "hours") {
        if ((event.key === "Backspace" && selectionStart === selectionEnd) || selectionEnd - selectionStart === 1) {
          if (selectionEnd === 1) {
            inputs.hours = "0" + state.hours[1];
          }
          else if (selectionEnd === 2) {
            inputs.hours = "0" + state.hours[0];
          }
        }
        else if (event.key === "Delete" && selectionStart === selectionEnd) {
          if (selectionStart === 1) {
            inputs.hours = state.hours[0] + state.minutes[0];
          }
          else if (selectionStart === 0) {
            inputs.hours = state.hours[1] + state.minutes[0];
          }
          inputs.minutes = state.minutes[1] + state.seconds[0];
          inputs.seconds = state.seconds[1] + "0";
        }
        else if (selectionEnd - selectionStart === 2) {
          inputs.hours = "00";
        }
      }
      updateInputs(inputs);
      requestAnimationFrame(() => {
        target.setSelectionRange(selectionEnd, selectionEnd);
      });
    }
    else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
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
