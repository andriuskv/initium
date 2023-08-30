import { useSettings } from "contexts/settings";

export default function Tasks() {
  const { settings: { tasks: settings }, toggleSetting } = useSettings();

  return (
    <div className="container-body setting-tab">
      <label className="setting">
        <span>Disable tasks</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.disabled}
          onChange={() => toggleSetting("tasks", "disabled")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <label className={`setting${settings.disabled ? " disabled" : ""}`}>
        <span>Show default group's header</span>
        <input type="checkbox" className="sr-only checkbox-input"
          disabled={settings.disabled}
          checked={settings.defaultGroupVisible}
          onChange={() => toggleSetting("tasks", "defaultGroupVisible")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <label className={`setting${settings.disabled ? " disabled" : ""}`}>
        <span>Hide empty groups</span>
        <input type="checkbox" className="sr-only checkbox-input"
          disabled={settings.disabled}
          checked={settings.emptyGroupsHidden}
          onChange={() => toggleSetting("tasks", "emptyGroupsHidden")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <label className={`setting${settings.disabled ? " disabled" : ""}`}>
        <span>Include subtasks in task count</span>
        <input type="checkbox" className="sr-only checkbox-input"
          disabled={settings.disabled}
          checked={settings.countSubtasks}
          onChange={() => toggleSetting("tasks", "countSubtasks")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <label className={`setting${settings.disabled ? " disabled" : ""}`}>
        <span>Show completed repeating tasks</span>
        <input type="checkbox" className="sr-only checkbox-input"
          disabled={settings.disabled}
          checked={settings.showCompletedRepeatingTasks}
          onChange={() => toggleSetting("tasks", "showCompletedRepeatingTasks")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <label className={`setting${settings.disabled ? " disabled" : ""}`}>
        <span>Hide task repeat history</span>
        <input type="checkbox" className="sr-only checkbox-input"
          disabled={settings.disabled}
          checked={settings.repeatHistoryHidden}
          onChange={() => toggleSetting("tasks", "repeatHistoryHidden")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
    </div>
  );
}
