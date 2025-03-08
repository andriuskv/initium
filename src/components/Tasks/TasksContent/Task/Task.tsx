import { type CSSProperties } from "react";
import type { TasksSettings } from "types/settings";
import type { TaskType } from "../../tasks.type";
import Icon from "components/Icon";

type Props = {
  locale: any,
  task: TaskType,
  groupIndex: number,
  taskIndex: number,
  settings: TasksSettings
  removeTask: (groupIndex: number, taskIndex: number) => void,
  removeSubtask: (groupIndex: number, taskIndex: number, subtaskIndex: number) => void,
  editTask: (groupIndex: number, taskIndex: number) => void,
}

const taskStatusMap = {
  "1": "failed",
  "2": "partial",
  "3": "completed"
};

export default function Task({ locale, task, groupIndex, taskIndex, settings, removeTask, removeSubtask, editTask }: Props) {
  const full = task.expirationDate - task.creationDate;
  const partial = task.expirationDate - Date.now();
  const dashoffset = 200 - 25 * (1 - partial / full);

  return (
    <li className={`task${task.removed ? " removed" : ""}`}>
      <div className="task-body">
        {task.labels.length > 0 && (
          <ul className="task-labels">
            {task.labels.map((label, i) => (
              <li className="task-label" key={i}>
                <div className="task-label-color" style={{ backgroundColor: label.color }}></div>
                <div className="task-label-title">{label.name}</div>
              </li>
            ))}
          </ul>
        )}
        <div className="task-text-container">
          {task.hidden ? (
            <div className="checkbox task-checkbox-btn disabled"></div>
          ) : (
            <button className="checkbox task-checkbox-btn"
              onClick={() => removeTask(groupIndex, taskIndex)} title={locale.tasks.complete}>
              <div className="checkbox-tick"></div>
            </button>
          )}
          <div className="task-text" dangerouslySetInnerHTML={{ __html: task.text }}></div>
        </div>
        {task.subtasks.length > 0 && (
          <ul className="subtasks">
            {task.subtasks.map((subtask, subtaskIndex) => (
              !settings.showCompletedRepeatingTasks && subtask.hidden ? null : (
                <li className={`subtask${subtask.removed ? " removed" : ""}`} key={subtask.id}>
                  <div className="subtask-body">
                    {subtask.hidden ? (
                      <div className="checkbox task-checkbox-btn disabled"></div>
                    ) : (
                      <button className="checkbox task-checkbox-btn"
                        onClick={() => removeSubtask(groupIndex, taskIndex, subtaskIndex)} title={locale.tasks.complete}>
                        <div className="checkbox-tick"></div>
                      </button>
                    )}
                    <span className="task-text" dangerouslySetInnerHTML={{ __html: subtask.text }}></span>
                    {task.completeWithSubtasks && subtask.optional ? <span className="task-text">*</span> : null}
                  </div>
                </li>
              )
            ))}
          </ul>
        )}
        <button className="btn icon-btn alt-icon-btn task-edit-btn"
          onClick={() => editTask(groupIndex, taskIndex)} title={locale.global.edit}>
          <Icon id="edit"/>
        </button>
        {task.expirationDate ? (
          <svg className="task-expiration-indicator">
            <title>Expires on {task.expirationDateString}</title>
            <circle cx="8" cy="8" r="4" strokeDasharray="100"
              className="task-expiration-indicator-visual"
              style={{ "--dashoffset": dashoffset } as CSSProperties}/>
          </svg>
        ) : null}
        {!settings.repeatHistoryHidden && task.repeat?.history.length ? (
          <div className="task-repeat-history">
            {task.repeat.history.map(item => (
              <div className={`task-repeat-history-item${item.status > 0 ? ` ${taskStatusMap[item.status]}` : ""}`}
                title={item.dateString} key={item.id}>
                {item.elapsed > 0 ? (
                  <div className="task-repeat-history-item-inner"
                    style={{ "--elapsed" : item.elapsed } as CSSProperties}></div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}
