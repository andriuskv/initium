import { useState, useRef, type InputEvent, type SubmitEvent } from "react";
import { getRandomString, getRandomHexColor } from "utils";
import Modal from "components/Modal";
import Icon from "components/Icon";
import "./group-form.css";
import type { Group } from "../../tasks.type";

type Props = {
  locale: any,
  action?: "create" | "edit",
  group?: Group,
  modal?: boolean,
  hiding?: boolean,
  submitAction: (group: Group) => void,
  hide: () => void,
}

export default function GroupForm({ locale, action = "create", group, submitAction, modal = false, hiding, hide }: Props) {
  const [currentColor, setCurrentColor] = useState(() => group?.color || getRandomHexColor());
  const [colorEnabled, setColorEnabled] = useState(!!group?.color);
  const updatingColor = useRef(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  function handleColorChange({ target }: InputEvent) {
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
  function handleGroupFormSubmit(event: SubmitEvent) {
    interface FormElements extends HTMLFormControlsCollection {
      name: HTMLInputElement;
    }
    const formElement = event.target as HTMLFormElement;
    const elements = formElement.elements as FormElements;

    event.preventDefault();

    if (action === "create") {
      submitAction({
        id: getRandomString(4),
        color: colorInputRef.current?.value,
        name: elements.name.value.trim(),
        expanded: true,
        taskCount: 0,
        tasks: []
      });
    } else {
      submitAction({
        ...group!,
        color: colorInputRef.current?.value,
        name: elements.name.value.trim(),
      });
    }

    if (modal) {
      hide();
    }
    else {
      formElement.reset();
    }
  }

  function enableColorSet() {
    setColorEnabled(true);

    requestAnimationFrame(() => {
      colorInputRef.current?.click();
    });
  }

  if (modal) {
    return (
      <Modal hiding={hiding} hide={hide}>
        <form onSubmit={handleGroupFormSubmit}>
          <h4 className="modal-title modal-title-center">{action === "edit" ? locale.tasks.edit_group : locale.tasks.new_group}</h4>
          <div className="task-modal-form-body">
            {colorEnabled ? (
              <div className="task-form-color-picker-container" style={{ backgroundColor: currentColor }}>
                <input type="color" name="color" className="task-form-color-picker" ref={colorInputRef}
                  onInput={handleColorChange} defaultValue={currentColor} title={locale.global.color_input_title} />
              </div>
            ) : <button type="button" className="btn icon-btn task-form-color-picker-icon-btn" onClick={enableColorSet} title={locale.global.color_input_title}>
              <Icon id="palette" className="task-form-color-picker-icon" size="24px" />
            </button>
            }
            <input type="text" className="input tasks-groups-form-input tasks-groups-form-modal-input" name="name"
              placeholder={locale.tasks.group_input_placeholder} defaultValue={group?.name} autoComplete="off" required />
          </div>
          <div className="modal-actions">
            {group?.color && <button type="button" className="btn text-btn" onClick={() => setColorEnabled(false)}>{locale.global.cancel}</button>}
            <button type="button" className="btn text-btn" onClick={hide}>{locale.global.cancel}</button>
            <button className="btn">{action === "edit" ? locale.global.edit : locale.global.create}</button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <form className="tasks-groups-form" onSubmit={handleGroupFormSubmit}>
      <div className="multi-input-container tasks-groups-form-input">
        <input type="text" className="input multi-input-left" name="name"
          placeholder={locale.tasks.group_input_placeholder} autoComplete="off" required />
        <button className="btn text-btn multi-input-right">{locale.global.create}</button>
      </div>
    </form>
  );
}
