import type { Label } from "../../../tasks.type";
import { useState, useRef, type FormEvent } from "react";
import { getRandomString, getRandomHexColor } from "utils";
import Icon from "components/Icon";
import Modal from "components/Modal";
import "./label-form.css";

type Props = {
  locale: any,
  addUniqueLabel: (label: Label) => boolean,
  removeTaskLabel: (label: Label) => void,
  hiding?: boolean,
  hide: () => void,
}

export default function LabelForm({ locale, addUniqueLabel, removeTaskLabel, hiding, hide }: Props) {
  const [currentColor, setCurrentColor] = useState(() => getRandomHexColor());
  const updatingColor = useRef(false);
  const [labels, setLabels] = useState(() => {
    const labels: Label[] = JSON.parse(localStorage.getItem("taskLabels")) || [];

    return labels.map((label: Label) => {
      label.id = getRandomString();
      return label;
    });
  });

  function handleColorChange({ target }: FormEvent) {
    if (updatingColor.current) {
      return;
    }
    const element = target as HTMLInputElement;
    updatingColor.current = true;

    requestAnimationFrame(() => {
      setCurrentColor(element.value);
      updatingColor.current = false;
    });
  }

  function handleLabelFormSubmit(event: FormEvent) {
    interface FormElements extends HTMLFormControlsCollection {
      name: HTMLInputElement;
      color: HTMLInputElement;
    }
    event.preventDefault();

    const formElement = event.target as HTMLFormElement;
    const elements = formElement.elements as FormElements;
    const name = elements.name.value.trim();
    const color = elements.color.value;

    if (name && color) {
      const label = {
        id: getRandomString(),
        name,
        color,
        flagged: true,
      };
      const added = addUniqueLabel(label);

      if (added) {
        saveLabels([...labels, label]);
      }
    }
    hide();
  }

  function removeLabel(label: Label) {
    const newLabels = labels.filter(({ id }) => label.id !== id);

    removeTaskLabel(label);
    setLabels(newLabels);
    saveLabels(newLabels);
  }

  function saveLabels(labels: Label[]) {
    localStorage.setItem("taskLabels", JSON.stringify(structuredClone(labels).map(label => {
      delete label.id;
      delete label.flagged;
      return label;
    })));
  }

  return (
    <Modal className="task-label-modal" hiding={hiding} hide={hide}>
      <form onSubmit={handleLabelFormSubmit}>
        <h4 className="modal-title modal-title-center">{locale.tasks.label_modal_title}</h4>
        <div className="task-label-form-body">
          <div className="task-form-color-picker-container" style={{ backgroundColor: currentColor }}>
            <input type="color" name="color" className="task-form-color-picker"
              onInput={handleColorChange} defaultValue={currentColor} title={locale.global.color_input_title}/>
          </div>
          <input type="text" name="name" className="input task-label-form-input" autoComplete="off" autoFocus required/>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn text-btn" onClick={hide}>{locale.global.cancel}</button>
          <button className="btn">{locale.global.create}</button>
        </div>
      </form>
      {labels.length ? (
        <ul className="task-label-form-labels">
          {labels.map(label => (
            <li className="task-form-label" key={label.id}>
              <button type="button" className={`btn icon-text-btn task-form-label-btn`}
                onClick={() => removeLabel(label)}
                title={locale.global.remove}>
                <div className="task-label-color" style={{ backgroundColor: label.color }}></div>
                <div className="task-label-title">{label.name}</div>
                <Icon id="trash" className="task-form-label-btn-icon"/>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </Modal>
  );
}
