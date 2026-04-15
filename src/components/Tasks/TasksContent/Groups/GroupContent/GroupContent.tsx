import type { Group } from "../../../tasks.type";
import Dropdown from "components/Dropdown";
import Icon from "components/Icon";

type Props = {
  locale: any,
  index: number,
  group: Group,
  allowRemoval?: boolean,
  enableGroupEdit: (group: Group) => void,
  showRemoveModal: (index: number) => void
}

export default function GroupContent({ locale, index, group, allowRemoval = true, enableGroupEdit, showRemoveModal }: Props) {
  return (
    <>
      <div className="tasks-group-count">{group.taskCount}</div>
      <div className="tasks-group-title">{group.name}</div>
      <Dropdown>
        <button className="btn icon-text-btn dropdown-btn" onClick={() => enableGroupEdit(group)}>
          <Icon id="edit" />
          <span>{locale.global.edit}</span>
        </button>
        {allowRemoval && (
          <button className="btn icon-text-btn dropdown-btn" onClick={() => showRemoveModal(index)}>
            <Icon id="trash" />
            <span>{locale.global.remove}</span>
          </button>
        )}
      </Dropdown>
    </>
  );
}
