import { useState, useRef } from "react";
import { getRandomString, getRandomHexColor } from "utils";
import Icon from "components/Icon";
import Modal from "components/Modal";
import "./label-form.css";

export default function LabelForm({ locale, addUniqueLabel, removeTaskLabel, hiding, hide }) {
  const [currentColor, setCurrentColor] = useState(() => getRandomHexColor());
  const updatingColor = useRef(false);
  const [labels, setLabels] = useState(() => (JSON.parse(localStorage.getItem("taskLabels")) || []).map(label => {
    label.id = getRandomString();
    return label;
  }));

  function handleColorChange({ target }) {
    if (updatingColor.current) {
      return;
    }
    updatingColor.current = true;

    requestAnimationFrame(() => {
      setCurrentColor(target.value);
      updatingColor.current = false;
    });
  }

  function handleLabelFormSubmit(event) {
    event.preventDefault();

    const { elements } = event.target;
    const label = {
      name: elements.name.value.trim(),
      color: elements.color.value
    };
    const added = addUniqueLabel(label);

    if (added) {
      saveLabels([...labels, {...label, id: getRandomString() }]);
    }
    hide();
  }

  function removeLabel(label) {
    const newLabels = labels.filter(({ id }) => label.id !== id);

    removeTaskLabel(label);
    setLabels(newLabels);
    saveLabels(newLabels);
  }

  function saveLabels(labels) {
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
