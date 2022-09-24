import { useState, useRef } from "react";
import { getRandomHexColor } from "utils";
import Modal from "components/Modal";
import "./label-form.css";

export default function LabelForm({ addUniqueLabel, hide }) {
  const [currentColor, setCurrentColor] = useState(() => getRandomHexColor());
  const updatingColor = useRef(false);

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
    const { elements } = event.target;

    event.preventDefault();

    addUniqueLabel({
      name: elements.name.value.trim(),
      color: elements.color.value
    });
    hide();
  }

  return (
    <Modal hide={hide}>
      <form onSubmit={handleLabelFormSubmit}>
        <h4 className="modal-title modal-title-center">New Label</h4>
        <div className="task-label-form-body">
          <div className="task-form-color-picker-container" style={{ backgroundColor: currentColor }}>
            <input type="color" name="color" className="task-form-color-picker"
              onInput={handleColorChange} defaultValue={currentColor} title="Change color"/>
          </div>
          <input type="text" name="name" className="input task-label-form-input" autoComplete="off" required/>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn text-btn" onClick={hide}>Cancel</button>
          <button className="btn">Create</button>
        </div>
      </form>
    </Modal>
  );
}
