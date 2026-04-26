import { type CSSProperties } from "react";
import type { TasksSettings } from "types/settings";
import type { TaskType, Subtask as SubtaskType } from "../../tasks.type";
import Icon from "components/Icon";

type Props = {
  locale: any,
  task: TaskType,
  groupId: string,
  settings: TasksSettings
  color?: string,
  removeTask: (groupId: string, taskId: string) => void,
  removeSubtask: (subtaskId: string) => void,
  editTask: (groupId: string, taskId: string) => void,
}

const taskStatusMap: { [key: string]: string } = {
  "1": "failed",
  "2": "partial",
  "3": "completed"
};

function getOffset(expirationDate: number, creationDate: number) {
  const full = expirationDate - creationDate;
  const partial = expirationDate - Date.now();
  const dashoffset = 200 - 25 * (1 - partial / full);
  return dashoffset;
}

function Subtasks({ subtasks, locale, settings, color, removeSubtask, completeWithSubtasks }: { subtasks: SubtaskType[], locale: any, settings: TasksSettings, color?: string, removeSubtask: (subtaskId: string) => void, completeWithSubtasks?: boolean }) {
  return (
    <ul className="subtasks">
      {subtasks.map((subtask) => (
        !settings.showCompletedRepeatingTasks && subtask.hidden ? null : (
          <li className={`subtask${subtask.removed ? " removed" : ""}`} key={subtask.id}>
            <div className="subtask-body">
              {subtask.hidden ? (
                <div className="checkbox task-checkbox-btn disabled"></div>
              ) : (
                <button className="checkbox task-checkbox-btn" style={{ "--tick-color": color } as CSSProperties}
                  onClick={() => removeSubtask(subtask.id)} title={locale.tasks.complete}>
                  <div className="checkbox-tick"></div>
                </button>
              )}
              <span className="task-text" dangerouslySetInnerHTML={{ __html: subtask.text || "" }}></span>
              {completeWithSubtasks && subtask.optional ? <span className="task-text">*</span> : null}
            </div>
            {subtask.subtasks && subtask.subtasks.length > 0 && (
              <Subtasks subtasks={subtask.subtasks} locale={locale} settings={settings} color={color} removeSubtask={removeSubtask} completeWithSubtasks={completeWithSubtasks} />
            )}
          </li>
        )
      ))}
    </ul>
  );
}

export default function Task({ locale, task, groupId, settings, color, removeTask, removeSubtask, editTask }: Props) {
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
            <button className="checkbox task-checkbox-btn" style={{ "--tick-color": color } as CSSProperties}
              onClick={() => removeTask(groupId, task.id)} title={locale.tasks.complete}>
              <div className="checkbox-tick"></div>
            </button>
          )}
          <div className="task-text" dangerouslySetInnerHTML={{ __html: task.text || "" }}></div>
        </div>
        {task.subtasks.length > 0 && (
          <Subtasks subtasks={task.subtasks} locale={locale} settings={settings} color={color} removeSubtask={removeSubtask} completeWithSubtasks={task.completeWithSubtasks} />
        )}
        <button className="btn icon-btn alt-icon-btn task-edit-btn"
          onClick={() => editTask(groupId, task.id)} title={locale.global.edit}>
          <Icon id="edit" />
        </button>
        {task.expirationDate ? (
          <svg className="task-expiration-indicator">
            <title>Expires on {task.expirationDateString}</title>
            <circle cx="8" cy="8" r="4" strokeDasharray="100"
              className="task-expiration-indicator-visual"
              style={{ "--dashoffset": getOffset(task.expirationDate, task.creationDate) } as CSSProperties} />
          </svg>
        ) : null}
        {!settings.repeatHistoryHidden && task.repeat?.history?.length ? (
          <div className="task-repeat-history">
            {task.repeat.history.map(item => (
              <div className={`task-repeat-history-item${item.status > 0 ? ` ${taskStatusMap[item.status]}` : ""}`}
                title={item.dateString} key={item.id}>
                {typeof item.elapsed === "number" && item.elapsed > 0 ? (
                  <div className="task-repeat-history-item-inner"
                    style={{ "--elapsed": item.elapsed } as CSSProperties}></div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}
