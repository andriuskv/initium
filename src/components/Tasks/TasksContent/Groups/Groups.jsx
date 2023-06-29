import { useState } from "react";
import { getRandomString } from "utils";
import { SortableItem, SortableList } from "components/Sortable";
import Dropdown from "components/Dropdown";
import Modal from "components/Modal";
import Icon from "components/Icon";
import "./groups.css";

export default function Groups({ groups, updateGroups, hide }) {
  const [removeModal, setRemoveModal] = useState(null);
  const [activeDragId, setActiveDragId] = useState(null);

  function showRemoveModal(index) {
    const groupIndex = index + 1;

    if (groups[groupIndex].tasks.length === 0) {
      removeGroup(groupIndex);
    }
    else {
      setRemoveModal({ groupIndex });
    }
  }

  function hideRemoveModal() {
    setRemoveModal(null);
  }

  function confirmGroupRemoval() {
    removeGroup(removeModal.groupIndex);
    hideRemoveModal();
  }

  function handleGroupFormSubmit(event) {
    // Insert new group after group that is hidden
    groups.splice(1, 0, {
      id: getRandomString(4),
      name: event.target.elements.name.value.trim(),
      expanded: true,
      tasks: []
    });
    event.preventDefault();
    event.target.reset();
    updateGroups(groups);
  }

  function enableGroupRename(group) {
    group.renameEnabled = true;
    updateGroups(groups, false);
  }

  function renameGroup(event, group) {
    const newName = event.target.value;
    let shouldSave = false;

    delete group.renameEnabled;

    if (newName && newName !== group.name) {
      group.name = newName;
      shouldSave = true;
    }
    updateGroups(groups, shouldSave);
  }

  function removeGroup(index) {
    groups.splice(index, 1);
    updateGroups(groups);
  }

  function blurGroupNameInput(event) {
    if (event.key === "Enter") {
      event.target.blur();
    }
  }

  function handleSort(items) {
    if (items) {
      updateGroups(items);
    }
    setActiveDragId(null);
  }

  function handleDragStart(event) {
    setActiveDragId(event.active.id);
  }

  function renderGroupContent(group, index, allowRemoval = true) {
    if (group.renameEnabled) {
      return (
        <input type="text" className="input tasks-group-input" autoFocus defaultValue={group.name}
          onBlur={(event) => renameGroup(event, group)} onKeyPress={blurGroupNameInput}/>
      );
    }
    return (
      <>
        <div className="tasks-group-count">{group.tasks.length}</div>
        <div className="tasks-group-title">{group.name}</div>
        <Dropdown>
          <button className="btn icon-text-btn dropdown-btn" onClick={() => enableGroupRename(group)}>
            <Icon id="edit"/>
            <span>Rename</span>
          </button>
          {allowRemoval && (
            <button className="btn icon-text-btn dropdown-btn" onClick={() => showRemoveModal(index)}>
              <Icon id="trash"/>
              <span>Remove</span>
            </button>
          )}
        </Dropdown>
      </>
    );
  }

  return (
    <div className="tasks-item-container task-transition-target">
      <form className="tasks-groups-form" onSubmit={handleGroupFormSubmit}>
        <div className="multi-input-container group-create-input-container">
          <input type="text" className="input multi-input-left" name="name" placeholder="Group name" autoComplete="off" required/>
          <button className="btn text-btn multi-input-right">Create</button>
        </div>
      </form>
      {groups.length > 1 ? (
        <ul className="tasks-groups-items" data-dropdown-parent>
          <li className="tasks-groups-item">
            {renderGroupContent(groups[0], 0, false)}
          </li>
          <SortableList
            items={groups}
            handleSort={handleSort}
            handleDragStart={handleDragStart}>
            {groups.slice(1).map((group, index) => (
              <SortableItem className={`tasks-groups-item${group.id === activeDragId ? " dragging" : ""}`} id={group.id} key={group.id}>
                {renderGroupContent(group, index)}
              </SortableItem>
            ))}
          </SortableList>
        </ul>
      ) : (
        <p className="tasks-groups-message">No groups</p>
      )}
      <div className="tasks-item-container-footer">
        <button className="btn text-btn" onClick={hide}>Done</button>
      </div>
      {removeModal && (
        <Modal hide={hideRemoveModal}>
          <h4 className="modal-title">Remove group</h4>
          <div className="modal-text-body">
            <p>Do you want to remove this group?</p>
          </div>
          <div className="modal-actions">
            <button className="btn text-btn" onClick={hideRemoveModal}>Cancel</button>
            <button className="btn" onClick={confirmGroupRemoval}>Remove</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
