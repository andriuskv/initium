import type { FormEvent } from "react";
import { getRandomString } from "utils";
import Modal from "components/Modal";
import "./group-form.css";
import type { Group } from "../../tasks.type";

type Props = {
  locale: any,
  modal?: boolean,
  hiding?: boolean,
  createGroup: (group: Group) => void,
  hide: () => void,
}

export default function GroupForm({ locale, createGroup, modal = false, hiding, hide }: Props) {
  function handleGroupFormSubmit(event: FormEvent) {
    interface FormElements extends HTMLFormControlsCollection {
      name: HTMLInputElement;
    }
    const formElement = event.target as HTMLFormElement;
    const elements = formElement.elements as FormElements;

    event.preventDefault();

    createGroup({
      id: getRandomString(4),
      name: elements.name.value.trim(),
      expanded: true,
      tasks: []
    });

    if (modal) {
      hide();
    }
    else {
      formElement.reset();
    }
  }

  if (modal) {
    return (
      <Modal hiding={hiding} hide={hide}>
        <form onSubmit={handleGroupFormSubmit}>
          <h4 className="modal-title modal-title-center">{locale.tasks.new_group}</h4>
          <input type="text" className="input tasks-groups-form-input tasks-groups-form-modal-input" name="name"
            placeholder={locale.tasks.group_input_placeholder} autoComplete="off" required/>
          <div className="modal-actions">
            <button type="button" className="btn text-btn" onClick={hide}>{locale.global.cancel}</button>
            <button className="btn">{locale.global.create}</button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <form className="tasks-groups-form" onSubmit={handleGroupFormSubmit}>
      <div className="multi-input-container tasks-groups-form-input">
        <input type="text" className="input multi-input-left" name="name"
          placeholder={locale.tasks.group_input_placeholder} autoComplete="off" required/>
        <button className="btn text-btn multi-input-right">{locale.global.create}</button>
      </div>
    </form>
  );
}
