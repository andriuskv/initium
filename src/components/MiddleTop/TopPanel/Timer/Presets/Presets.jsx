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
  const [form, setForm] = useState({ name: "" });

  function updateInputs(inputs) {
    setState({ ...inputs });
  }

  function createPreset(event) {
    event.preventDefault();

    if (isValuesInvalid(state)) {
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
    resetForm();
  }

  function isValuesInvalid(state) {
    return Object.values(state).every(value => value === "00") || Object.values(state).some(value => /\D/.test(value));
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

  function resetForm() {
    setForm({ name: "" });
    setState({
      hours: "00",
      minutes: "00",
      seconds: "00"
    });
  }

  function handlePresetNameChange(event) {
    setForm({ ...form, name: event.target.value });
  }

  return (
    <div className="timer-presets">
      <form onSubmit={createPreset}>
        <div className="timer-presets-form-body">
          <input type="text" className="input timer-presets-form-name-input" name="name" placeholder="Preset name"
            value={form.name} onChange={handlePresetNameChange} autoComplete="off" required/>
          <Inputs state={state} updateInputs={updateInputs} handleKeyDown={resetFormError}/>
        </div>
        {form.error && <p className="timer-presets-form-message">Please enter valid time.</p>}
        <div className="timer-presets-form-footer">
          {form.updating && <button type="button" className="btn text-btn" onClick={resetForm}>Cancel</button>}
          <button className="btn">{form.updating ? "Update" : "Create"}</button>
        </div>
      </form>
      {presets.length ? (
        <ul className="timer-preset-list" data-dropdown-parent>
          {presets.map((preset, i) => (
            <li className={`timer-preset${form.index === i ? " updating" : ""}`} key={preset.id}>
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
      <div className="top-panel-item-actions timer-presets-footer">
        <button className="btn text-btn" onClick={hide}>Done</button>
      </div>
    </div>
  );
}
