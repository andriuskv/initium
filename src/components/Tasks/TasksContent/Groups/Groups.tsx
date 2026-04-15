import type { DragStartEvent } from "@dnd-kit/core";
import type { Group } from "../../tasks.type";
import { useState } from "react";
import { useModal } from "@/hooks";
import { SortableItem, SortableList } from "components/Sortable";
import Modal from "components/Modal";
import CreateButton from "components/CreateButton";
import "./groups.css";
import GroupForm from "../GroupForm";
import GroupContent from "./GroupContent";

type Props = {
  groups: Group[],
  locale: any,
  updateGroups: (groups: Group[], shouldSave?: boolean) => void,
  createGroup: (group: Group) => void,
  editGroup: (group: Group) => void,
  hide: () => void,
}

export default function Groups({ groups, locale, updateGroups, createGroup, editGroup, hide }: Props) {
  const { modal, setModal, hiding: modalHiding, hideModal } = useModal();
  const [activeDragId, setActiveDragId] = useState("");

  function showRemoveModal(index: number) {
    // + 1 to skip default group
    const groupIndex = index + 1;

    if (groups[groupIndex].tasks.length === 0) {
      removeGroup(groupIndex);
    }
    else {
      setModal({ type: "confirm", groupIndex });
    }
  }

  function confirmGroupRemoval() {
    if (modal?.type === "confirm") {
      removeGroup(modal.groupIndex);
    }
    hideModal();
  }

  function removeGroup(index: number) {
    groups.splice(index, 1);
    updateGroups(groups);
  }

  function handleSort(items: unknown[] | null) {
    if (items) {
      updateGroups(items as Group[]);
    }
    setActiveDragId("");
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
  }

  function showGroupForm() {
    setModal({ type: "form", action: "create" });
  }

  function enableGroupEdit(group: Group) {
    setModal({ type: "form", action: "edit", group });
  }

  return (
    <>
      <div className="container-header"></div>
      <div className="container-body tasks-body tasks-groups-items-container">
        <ul className="tasks-groups-items" data-dropdown-parent>
          <li className="tasks-groups-item" style={{ "--group-color": groups[0].color } as React.CSSProperties}>
            <GroupContent locale={locale} group={groups[0]} index={0} allowRemoval={false}
              showRemoveModal={showRemoveModal} enableGroupEdit={enableGroupEdit} />
          </li>
          <SortableList
            items={groups}
            handleSort={handleSort}
            handleDragStart={handleDragStart}>
            {groups.slice(1).map((group, index) => (
              <SortableItem className={`tasks-groups-item${group.id === activeDragId ? " dragging" : ""}`} style={{ "--group-color": group.color } as React.CSSProperties} id={group.id} key={group.id}>
                <GroupContent locale={locale} group={group} index={index}
                  showRemoveModal={showRemoveModal} enableGroupEdit={enableGroupEdit} />
              </SortableItem>
            ))}
          </SortableList>
        </ul>
        <CreateButton className="tasks-create-btn" onClick={showGroupForm} shiftTarget=".task-edit-btn" trackScroll></CreateButton>
      </div>
      <div className="container-footer">
        <button className="btn text-btn" onClick={hide}>{locale.global.done}</button>
      </div>
      {modal?.type === "confirm" ? (
        <Modal hiding={modalHiding} hide={hideModal}>
          <h4 className="modal-title">{locale.tasks.remove_group_modal_title}</h4>
          <div className="modal-text-body">
            <p>{locale.tasks.remove_group_modal_message}</p>
          </div>
          <div className="modal-actions">
            <button className="btn text-btn" onClick={hideModal}>{locale.global.cancel}</button>
            <button className="btn" onClick={confirmGroupRemoval}>{locale.global.remove}</button>
          </div>
        </Modal>
      ) : modal?.type === "form" ? (
        <GroupForm locale={locale} action={modal.action} submitAction={modal.action === "create" ? createGroup : editGroup} group={modal.group} hiding={modalHiding} hide={hideModal} modal />
      ) : null}
    </>
  );
}
