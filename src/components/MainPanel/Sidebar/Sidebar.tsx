import { useState } from "react";
import Icon from "components/Icon";
import "./sidebar.css";

type Props = {
  locale: any,
  expanded?: boolean,
  resizerEnabled: boolean,
  expandTab: () => void,
  toggleResizer: () => void
}

export default function Sidebar({ locale, expanded, resizerEnabled, expandTab, toggleResizer }: Props) {
  const [visible, setVisible] = useState(false);

  function show() {
    setVisible(true);
  }

  function hide() {
    setVisible(false);
  }

  return (
    <div className={`container main-panel-sidebar${visible ? " expanded" : ""}`}>
      {visible ? (
        <div className="main-panel-sidebar-btns">
          <button className="btn icon-btn main-panel-sidebar-btn" onClick={hide} title={locale.global.hide}>
            <Icon id="chevron-left"/>
          </button>
          <button className="btn icon-btn main-panel-sidebar-btn" onClick={expandTab} title={expanded ? locale.global.shrink : locale.global.expand}>
            <Icon id={`vertical-${expanded ? "shrink" : "expand"}`}/>
          </button>
          <button className="btn icon-btn main-panel-sidebar-btn" onClick={toggleResizer} disabled={expanded}
            title={resizerEnabled ? locale.mainPanel.disable_resizer_title : locale.mainPanel.enable_resizer_title}>
            <Icon id={`lock${resizerEnabled ? "-open" : ""}`}/>
          </button>
        </div>
      ) : (
        <button className="main-panel-sidebar-show-btn" onClick={show} title={locale.mainPanel.show_sidebar_title}></button>
      )}
    </div>
  );
}
