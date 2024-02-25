import { useState, useRef } from "react";
import { getRandomHexColor } from "utils";
import Modal from "components/Modal";
import "./label-form.css";

export default function LabelForm({ locale, addUniqueLabel, hiding, hide }) {
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
    <Modal hiding={hiding} hide={hide}>
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
    </Modal>
  );
}
