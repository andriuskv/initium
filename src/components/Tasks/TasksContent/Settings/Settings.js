import { useState, useRef, lazy, Suspense, useLayoutEffect } from "react";

const Resizer = lazy(() => import("components/Resizer"));

export default function Settings({ settings, toggleSetting, saveHeight, hide }) {
  const containerRef = useRef(null);
  const [resizerEnabled, setResizerEnabled] = useState(false);

  useLayoutEffect(() => {
    containerRef.current = document.querySelector(".tasks");
  }, []);

  function toggleResizer(event) {
    setResizerEnabled(event.target.checked);
  }

  function hideSettings() {
    if (resizerEnabled) {
      setResizerEnabled(false);
    }
    hide();
  }

  return (
    <>
      <div className="tasks-item-container task-transition-target" ref={containerRef}>
        <label className="checkbox-container tasks-settings-item">
          <input type="checkbox" className="sr-only checkbox-input"
            name="defaultGroupVisible" checked={settings.defaultGroupVisible}
            onChange={toggleSetting}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
          <span>Show default group header</span>
        </label>
        <label className="checkbox-container tasks-settings-item">
          <input type="checkbox" className="sr-only checkbox-input"
            name="emptyGroupsHidden" checked={settings.emptyGroupsHidden}
            onChange={toggleSetting}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
          <span>Hide empty groups</span>
        </label>
        <label className="checkbox-container tasks-settings-item">
          <input type="checkbox" className="sr-only checkbox-input"
            name="repeatHistoryHidden" checked={settings.repeatHistoryHidden}
            onChange={toggleSetting}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
          <span>Hide task repeat history</span>
        </label>
        <label className="checkbox-container tasks-settings-item">
          <input type="checkbox" className="sr-only checkbox-input"
            name="showCompletedRepeatingTasks" checked={settings.showCompletedRepeatingTasks}
            onChange={toggleSetting}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
          <span>Show completed repeating tasks</span>
        </label>
        <label className="checkbox-container tasks-settings-item">
          <input type="checkbox" className="sr-only checkbox-input"
            checked={resizerEnabled} onChange={toggleResizer}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
          <span>Enable resizing</span>
        </label>
        <div className="tasks-item-container-footer">
          <button className="btn text-btn" onClick={hideSettings}>Done</button>
        </div>
      </div>
      <Suspense fallback={null}>
        {resizerEnabled && <Resizer container={containerRef.current} saveHeight={saveHeight}/>}
      </Suspense>
    </>
  );
}
