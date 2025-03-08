import { type KeyboardEvent, type FocusEvent } from "react";
import type { Group } from "../../../tasks.type";
import Dropdown from "components/Dropdown";
import Icon from "components/Icon";

type Props = {
  locale: any,
  index: number,
  group: Group,
  allowRemoval?: boolean,
  renameGroup: (event: FocusEvent, group: Group) => void,
  enableGroupRename: (group: Group) => void,
  showRemoveModal: (index: number) => void
}

export default function GroupContent({ locale, index, group, allowRemoval = true, renameGroup, enableGroupRename, showRemoveModal }: Props) {
  function blurGroupNameInput(event: KeyboardEvent) {
    if (event.key === "Enter") {
      (event.target as HTMLInputElement).blur();
    }
  }

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
