import type { FocusEvent, KeyboardEvent } from "react";
import type { Group } from "../../tasks.type";
import { useState } from "react";
import { useModal } from "hooks";
import { SortableItem, SortableList } from "components/Sortable";
import Dropdown from "components/Dropdown";
import Modal from "components/Modal";
import Icon from "components/Icon";
import "./groups.css";
import GroupForm from "../GroupForm";

type Props = {
  groups: Group[],
  locale: any,
  updateGroups: (groups: Group[], shouldSave?: boolean) => void,
  createGroup: (group: Group) => void,
  hide: () => void,
}

export default function Groups({ groups, locale, updateGroups, createGroup, hide }: Props) {
  const { modal, setModal, hideModal } = useModal();
  const [activeDragId, setActiveDragId] = useState(null);

  function showRemoveModal(index: number) {
    const groupIndex = index + 1;

    if (groups[groupIndex].tasks.length === 0) {
      removeGroup(groupIndex);
    }
    else {
      setModal({ groupIndex });
    }
  }

  function confirmGroupRemoval() {
    removeGroup(modal.groupIndex);
    hideModal();
  }

  function enableGroupRename(group: Group) {
    group.renameEnabled = true;
    updateGroups(groups, false);
  }

  function renameGroup(event: FocusEvent, group: Group) {
    const newName = (event.target as HTMLInputElement).value;
    let shouldSave = false;

    delete group.renameEnabled;

    if (newName && newName !== group.name) {
      group.name = newName;
      shouldSave = true;
    }
    updateGroups(groups, shouldSave);
  }

  function removeGroup(index: number) {
    groups.splice(index, 1);
    updateGroups(groups);
  }

  function blurGroupNameInput(event: KeyboardEvent) {
    if (event.key === "Enter") {
      (event.target as HTMLInputElement).blur();
    }
  }

  function handleSort(items: Group[]) {
    if (items) {
      updateGroups(items);
    }
    setActiveDragId(null);
  }

  function handleDragStart(event) {
    setActiveDragId(event.active.id);
  }

  function renderGroupContent(group: Group, index: number, allowRemoval = true) {
    if (group.renameEnabled) {
      return (
        <input type="text" className="input tasks-group-input" autoFocus defaultValue={group.name}
          onBlur={(event) => renameGroup(event, group)} onKeyUp={blurGroupNameInput}/>
      );
    }
    return (
      <>
        <div className="tasks-group-count">{group.taskCount}</div>
        <div className="tasks-group-title">{group.name}</div>
        <Dropdown>
          <button className="btn icon-text-btn dropdown-btn" onClick={() => enableGroupRename(group)}>
            <Icon id="edit"/>
            <span>{locale.global.rename}</span>
          </button>
          {allowRemoval && (
            <button className="btn icon-text-btn dropdown-btn" onClick={() => showRemoveModal(index)}>
              <Icon id="trash"/>
              <span>{locale.global.remove}</span>
            </button>
          )}
        </Dropdown>
      </>
    );
  }

  return (
    <>
      <div className="container-header"></div>
      <div className="container-body tasks-body">
        <GroupForm locale={locale} createGroup={createGroup} hide={hide}/>
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
      </div>
      <div className="container-footer">
        <button className="btn text-btn" onClick={hide}>{locale.global.done}</button>
      </div>
      {modal && (
        <Modal hiding={modal.hiding} hide={hideModal}>
          <h4 className="modal-title">{locale.tasks.remove_group_modal_title}</h4>
          <div className="modal-text-body">
            <p>{locale.tasks.remove_group_modal_message}</p>
          </div>
          <div className="modal-actions">
            <button className="btn text-btn" onClick={hideModal}>{locale.global.cancel}</button>
            <button className="btn" onClick={confirmGroupRemoval}>{locale.global.remove}</button>
          </div>
        </Modal>
      )}
    </>
  );
}
