import { useSettings } from "contexts/settings";

export default function Tasks({ locale }: { locale: any }) {
  const { settings: { tasks: settings }, toggleSetting } = useSettings();

  return (
    <div className="container-body setting-tab">
      <label className="setting">
        <span>{locale.settings.tasks.disable_tasks_label}</span>
        <input type="checkbox" className="sr-only checkbox-input"
          checked={settings.disabled}
          onChange={() => toggleSetting("tasks", "disabled")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <label className={`setting${settings.disabled ? " disabled" : ""}`}>
        <span>{locale.settings.tasks.show_default_group_label}</span>
        <input type="checkbox" className="sr-only checkbox-input"
          disabled={settings.disabled}
          checked={settings.defaultGroupVisible}
          onChange={() => toggleSetting("tasks", "defaultGroupVisible")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <label className={`setting${settings.disabled ? " disabled" : ""}`}>
        <span>{locale.settings.tasks.hide_empty_groups_label}</span>
        <input type="checkbox" className="sr-only checkbox-input"
          disabled={settings.disabled}
          checked={settings.emptyGroupsHidden}
          onChange={() => toggleSetting("tasks", "emptyGroupsHidden")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <label className={`setting${settings.disabled ? " disabled" : ""}`}>
        <span>{locale.settings.tasks.count_subtasks_label}</span>
        <input type="checkbox" className="sr-only checkbox-input"
          disabled={settings.disabled}
          checked={settings.countSubtasks}
          onChange={() => toggleSetting("tasks", "countSubtasks")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <label className={`setting${settings.disabled ? " disabled" : ""}`}>
        <span>{locale.settings.tasks.show_completed_reateating_tasks_label}</span>
        <input type="checkbox" className="sr-only checkbox-input"
          disabled={settings.disabled}
          checked={settings.showCompletedRepeatingTasks}
          onChange={() => toggleSetting("tasks", "showCompletedRepeatingTasks")}/>
        <div className="checkbox">
          <div className="checkbox-tick"></div>
        </div>
      </label>
      <label className={`setting${settings.disabled ? " disabled" : ""}`}>
        <span>{locale.settings.tasks.hide_repeat_history_label}</span>
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
