import { useState } from "react";
import { getRandomString } from "utils";
import Dropdown from "components/Dropdown";
import Icon from "components/Icon";
import "./presets.css";
import Inputs from "../Inputs";

export default function Presets({ presets, updatePresets, resetActivePreset, hide }) {
  const [state, setState] = useState({
    hours: "00",
    minutes: "00",
    seconds: "00"
  });
  const [form, setForm] = useState(null);

  function createPreset(event) {
    event.preventDefault();

    if (state.hours === "00" && state.minutes === "00" && state.seconds === "00") {
      setForm({ ...form, error: true });
      return;
    }
    const presetName = event.target.elements.name.value.trim();

    if (form.updating) {
      const preset = presets[form.index];

      preset.name = presetName;
      preset.hours = state.hours;
      preset.minutes = state.minutes;
      preset.seconds = state.seconds;

      resetActivePreset(preset);
    }
    else {
      presets.unshift({
        name: presetName,
        id: getRandomString(4),
        ...state
      });
    }
    updatePresets(presets);
    hideForm();
  }

  function resetFormError() {
    if (form.error) {
      setForm({ ...form, error: false });
    }
  }

  function editPreset(index) {
    const preset = presets[index];

    setForm({
      ...preset,
      index,
      updating: true
    });

    setState({
      hours: preset.hours,
      minutes: preset.minutes,
      seconds: preset.seconds
    });
  }

  function removePreset(index) {
    presets.splice(index, 1);
    updatePresets(presets);
  }

  function showForm() {
    setForm({});
    setState({
      hours: "00",
      minutes: "00",
      seconds: "00"
    });
  }

  function hideForm() {
    setForm(null);
  }

  if (form) {
    return (
      <form onSubmit={createPreset}>
        <div className="timer-form-body">
          <input type="text" className="input timer-form-name-input" name="name" placeholder="Preset name"
            defaultValue={form.name} autoComplete="off" required/>
          <Inputs state={state} setState={setState} handleKeyDown={resetFormError}/>
        </div>
        <div className="top-panel-item-actions timer-create-preset-footer">
          {form.error && <p className="timer-form-message">Please enter valid time.</p>}
          <button type="button" className="btn text-btn" onClick={hideForm}>Cancel</button>
          <button className="btn">{form.updating ? "Update" : "Create"}</button>
        </div>
      </form>
    );
  }
  return (
    <>
      {presets.length ? (
        <ul className="timer-presets" data-dropdown-parent>
          {presets.map((preset, i) => (
            <li className="timer-preset" key={preset.id}>
              <div>
                <div className="timer-preset-name">{preset.name}</div>
                <div className="timer-preset-time">{preset.hours}:{preset.minutes}:{preset.seconds}</div>
              </div>
              <Dropdown>
                <button className="btn icon-text-btn dropdown-btn" onClick={() => editPreset(i)}>
                  <Icon id="edit"/>
                  <span>Edit</span>
                </button>
                <button className="btn icon-text-btn dropdown-btn" onClick={() => removePreset(i)}>
                  <Icon id="trash"/>
                  <span>Remove</span>
                </button>
              </Dropdown>
            </li>
          ))}
        </ul>
      ) : (
        <p className="top-panel-item-content timer-presets-message">No presets</p>
      )}
      <div className="top-panel-item-actions timer-preset-list-footer">
        <button type="button" className="btn icon-text-btn" onClick={showForm}>
          <Icon id="plus"/>
          <span>New preset</span>
        </button>
        <button className="btn text-btn" onClick={hide}>Done</button>
      </div>
    </>
  );
}
