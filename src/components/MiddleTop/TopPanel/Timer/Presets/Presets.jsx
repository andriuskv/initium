import { useState } from "react";
import { getRandomString } from "utils";
import * as chromeStorage from "services/chromeStorage";
import { SortableItem, SortableList } from "components/Sortable";
import Dropdown from "components/Dropdown";
import Icon from "components/Icon";
import "./presets.css";
import Inputs from "../Inputs";

export default function Presets({ presets, locale, updatePresets, getUpdatedTime, resetActivePreset, hide }) {
  const [state, setState] = useState({
    hours: "00",
    minutes: "00",
    seconds: "00"
  });
  const [form, setForm] = useState({ name: "" });
  const [activeDragId, setActiveDragId] = useState(null);
  const [localPresets, setLocalPresets] = useState(presets);

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
      const preset = localPresets[form.index];

      preset.name = presetName;
      preset.hours = state.hours;
      preset.minutes = state.minutes;
      preset.seconds = state.seconds;

      resetActivePreset(preset);
    }
    else {
      localPresets.unshift({
        name: presetName,
        id: getRandomString(4),
        ...state
      });
    }
    updatePresets(localPresets);
    savePresets(localPresets);
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
    const preset = localPresets[index];

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
    localPresets.splice(index, 1);
    updatePresets(localPresets);
    savePresets(localPresets);
  }

  function resetForm() {
    setForm({ name: "" });
    setState({
      hours: "00",
      minutes: "00",
      seconds: "00"
    });
  }

  function savePresets(presets) {
    chromeStorage.set({ timer: presets });
  }

  function handlePresetNameChange(event) {
    setForm({ ...form, name: event.target.value });
  }

  function addTime(to, event) {
    const values = getUpdatedTime(state, { to, sign: 1 }, event);
    setState(values);
  }

  function removeTime(to, event) {
    const values = getUpdatedTime(state, { to, sign: -1 }, event);
    setState(values);
  }

  function handleDragStart(event) {
    setActiveDragId(event.active.id);
  }

  function handleSort(items) {
    if (items) {
      setLocalPresets(items);
      updatePresets(items);
      savePresets(items);
    }
    setActiveDragId(null);
  }

  return (
    <div className="timer-presets">
      <form className="container-header" onSubmit={createPreset}>
        <div className="timer-presets-form-body">
          <input type="text" className="input timer-presets-form-name-input" name="name"
            value={form.name} placeholder={locale.timer.presets_input_placeholder}
            onChange={handlePresetNameChange} autoComplete="off" required/>
          <Inputs state={state} updateInputs={updateInputs} addTime={addTime} removeTime={removeTime} handleKeyDown={resetFormError}/>
        </div>
        {form.error && <p className="timer-presets-form-message">{locale.timer.presets_form_message}</p>}
        <div className="timer-presets-form-footer">
          {form.updating && <button type="button" className="btn text-btn" onClick={resetForm}>{locale.global.cancel}</button>}
          <button className="btn">{form.updating ? locale.global.update : locale.global.create}</button>
        </div>
      </form>
      {localPresets.length ? (
        <ul className="timer-preset-list" data-dropdown-parent>
          <SortableList
            items={localPresets}
            handleSort={handleSort}
            handleDragStart={handleDragStart}>
            {localPresets.map((preset, i) => (
              <SortableItem className={`timer-preset${form.index === i ? " updating" : ""}${preset.id === activeDragId ? " dragging" : ""}`}
                id={preset.id} key={preset.id}>
                <div>
                  <div className="timer-preset-name">{preset.name}</div>
                  <div className="timer-preset-time">{preset.hours}:{preset.minutes}:{preset.seconds}</div>
                </div>
                <Dropdown>
                  <button className="btn icon-text-btn dropdown-btn" onClick={() => editPreset(i)}>
                    <Icon id="edit"/>
                    <span>{locale.global.edit}</span>
                  </button>
                  <button className="btn icon-text-btn dropdown-btn" onClick={() => removePreset(i)}>
                    <Icon id="trash"/>
                    <span>{locale.global.remove}</span>
                  </button>
                </Dropdown>
              </SortableItem>
            ))}
          </SortableList>
        </ul>
      ) : (
        <p className="top-panel-item-content timer-presets-message">{locale.timer.no_presets_message}</p>
      )}
      <div className="container-footer">
        <button className="btn text-btn" onClick={hide}>{locale.global.done}</button>
      </div>
    </div>
  );
}
