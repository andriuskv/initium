import type { Preset, Time } from "../timer.type";
import { useState, type MouseEvent, type FormEvent, type ChangeEvent } from "react";
import { getRandomString } from "utils";
import * as chromeStorage from "services/chromeStorage";
import { SortableItem, SortableList } from "components/Sortable";
import Dropdown from "components/Dropdown";
import Icon from "components/Icon";
import "./presets.css";
import Inputs from "../Inputs";

type Props = {
  presets: Preset[],
  locale: any,
  updatePresets: (presets: Preset[]) => void,
  getUpdatedTime: (initialValues: Time, options: { to: string, sign: number, shouldPad?: boolean }, event: MouseEvent) => Time & { duration: number},
  resetActivePreset: (preset: Preset) => void,
  hide: () => void,
};

export default function Presets({ presets, locale, updatePresets, getUpdatedTime, resetActivePreset, hide }: Props) {
  const [state, setState] = useState<Time>({
    hours: "00",
    minutes: "00",
    seconds: "00"
  });
  const [form, setForm] = useState<{ name: string, index?: number, updating?: boolean, error?: boolean }>({ name: "" });
  const [activeDragId, setActiveDragId] = useState(null);
  const [localPresets, setLocalPresets] = useState<Preset[]>(presets);

  function updateInputs(inputs: Time) {
    setState({ ...inputs });
  }

  function createPreset(event: FormEvent) {
    interface FormElements extends HTMLFormControlsCollection {
      name: HTMLInputElement;
    }

    event.preventDefault();

    if (isValuesInvalid(state)) {
      setForm({ ...form, error: true });
      return;
    }
    const formElement = event.target as HTMLFormElement;
    const { name } = formElement.elements as FormElements;
    const presetName = name.value.trim();

    if (form.updating) {
      const preset = localPresets[form.index];

      resetActivePreset({
        name: presetName,
        id: preset.id,
        hours: state.hours,
        minutes: state.minutes,
        seconds: state.seconds
      });
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

  function isValuesInvalid(state: Time) {
    return Object.values(state).every(value => value === "00") || Object.values(state).some(value => /\D/.test(value));
  }

  function resetFormError() {
    if (form.error) {
      setForm({ ...form, error: false });
    }
  }

  function editPreset(index: number) {
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

  function removePreset(index: number) {
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

  function savePresets(presets: Preset[]) {
    chromeStorage.set({ timer: presets });
  }

  function handlePresetNameChange(event: ChangeEvent) {
    setForm({ ...form, name: (event.target as HTMLInputElement).value });
  }

  function addTime(to: string, event: MouseEvent) {
    const values = getUpdatedTime(state, { to, sign: 1 }, event);
    setState(values);
  }

  function removeTime(to: string, event: MouseEvent) {
    const values = getUpdatedTime(state, { to, sign: -1 }, event);
    setState(values);
  }

  function handleDragStart(event) {
    setActiveDragId(event.active.id);
  }

  function handleSort(items: Preset[]) {
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
