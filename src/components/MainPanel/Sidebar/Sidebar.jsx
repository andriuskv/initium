import { useState } from "react";
import Icon from "components/Icon";
import "./sidebar.css";

export default function Sidebar({ expanded, expandTab, resizerEnabled, toggleResizer }) {
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
          <button className="btn icon-btn main-panel-sidebar-btn" onClick={hide} title="Hide">
            <Icon id="chevron-left"/>
          </button>
          {/* <button className="btn icon-btn main-panel-sidebar-btn" onClick={expandTab} title="Toggle size"> */}
          <button className="btn icon-btn main-panel-sidebar-btn" onClick={expandTab} title={expanded ? "Shrink" : "Expand"}>
            <Icon id={`vertical-${expanded ? "shrink" : "expand"}`}/>
          </button>
          <button className="btn icon-btn main-panel-sidebar-btn" onClick={toggleResizer} disabled={expanded}
            title={`${resizerEnabled ? "Disable" : "Enable"} resizing`}>
            <Icon id={`lock${resizerEnabled ? "-open" : ""}`}/>
          </button>
        </div>
      ) : (
        <button className="main-panel-sidebar-show-btn" onClick={show} title="Show sidebar"></button>
      )}
    </div>
  );
}
