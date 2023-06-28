export default function Settings({ settings, toggleSetting, hide }) {
  return (
    <div className="tasks-item-container task-transition-target">
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
          name="countSubtasks" checked={settings.countSubtasks}
          onChange={toggleSetting}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
        <span>Include subtasks in task count</span>
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
          name="repeatHistoryHidden" checked={settings.repeatHistoryHidden}
          onChange={toggleSetting}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
        <span>Hide task repeat history</span>
      </label>
      <div className="tasks-item-container-footer">
        <button className="btn text-btn" onClick={hide}>Done</button>
      </div>
    </div>
  );
}
