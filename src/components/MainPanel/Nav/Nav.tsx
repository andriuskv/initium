import type { Tabs } from "../MainPanel.type";
import Icon from "components/Icon";

type Props = {
  tabs: Tabs,
  disabled: boolean,
  selectTab: (id: string) => void
}

export default function Nav({ tabs, disabled, selectTab }: Props) {
  if (disabled) {
    return null;
  }
  return (
    <ul className="main-panel-nav">
      {Object.values(tabs).map(tab => (
        tab.disabled ? null : (
          <li key={tab.id}>
            <button className={`btn icon-btn panel-item-btn${tab.indicatorVisible ? " indicator" : ""}`}
              onClick={() => selectTab(tab.id)} aria-label={tab.title} data-tooltip={tab.title}>
              <Icon id={tab.iconId} className="panel-item-btn-icon"/>
            </button>
          </li>
        )
      ))}
    </ul>
  );
}
