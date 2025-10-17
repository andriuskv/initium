import Icon from "components/Icon";
import { handleMoveInit } from "services/widgetStates";
import Dropdown from "components/Dropdown";

type Props = {
  locale: any,
  expanded: boolean,
  showGroups: () => void
  toggleSize: () => void
}

export default function Header({ locale, expanded, showGroups, toggleSize }: Props) {
  return (
    <div className="container-header" onPointerDown={handleMoveInit} data-move-id="tasks">
      <Dropdown>
        <button className="btn icon-text-btn dropdown-btn" onClick={showGroups}>
          <Icon id="menu"/>
          <span>{locale.tasks.groups}</span>
        </button>
        <button className="btn icon-text-btn dropdown-btn" onClick={toggleSize}>
          <Icon id={`vertical-${expanded ? "shrink" : "expand"}`}/>
          <span>{expanded ? locale.global.shrink : locale.global.expand}</span>
        </button>
      </Dropdown>
    </div>
  );
}
