import { getRandomString } from "utils";
import Modal from "components/Modal";
import "./group-form.css";

export default function GroupForm({ createGroup, modal = false, hide }) {
  function handleGroupFormSubmit(event) {
    event.preventDefault();

    createGroup({
      id: getRandomString(4),
      name: event.target.elements.name.value.trim(),
      expanded: true,
      tasks: []
    });

    if (modal) {
      hide();
    }
    else {
      event.target.reset();
    }
  }

  if (modal) {
    return (
      <Modal hide={hide}>
        <form onSubmit={handleGroupFormSubmit}>
          <h4 className="modal-title modal-title-center">New Group</h4>
          <input type="text" className="input tasks-groups-form-input" name="name" placeholder="Group name" autoComplete="off" required/>
          <div className="modal-actions">
            <button type="button" className="btn text-btn" onClick={hide}>Cancel</button>
            <button className="btn">Create</button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <form className="tasks-groups-form" onSubmit={handleGroupFormSubmit}>
      <div className="multi-input-container tasks-groups-form-input">
        <input type="text" className="input multi-input-left" name="name" placeholder="Group name" autoComplete="off" required/>
        <button className="btn text-btn multi-input-right">Create</button>
      </div>
    </form>
  );
}
