import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { getRandomString } from "utils";
import * as chromeStorage from "services/chromeStorage";
import { getSetting } from "services/settings";
import { formatDate } from "services/timeDate";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import CreateButton from "components/CreateButton";
import "./tasks-content.css";

const Form = lazy(() => import("./Form"));
const Groups = lazy(() => import("./Groups"));

const IN_PROGRESS_STATUS = 0;
const FAILED_STATUS = 1;
const PARTIAL_STATUS = 2;
const COMPLETED_STATUS = 3;

const taskStatusMap = {
  "1": "failed",
  "2": "partial",
  "3": "completed"
};

export default function Tasks({ settings, expanded, toggleSize }) {
  const [groups, setGroups] = useState(null);
  const [removedItems, setRemovedItems] = useState([]);
  const [form, setForm] = useState(null);
  const [activeComponent, setActiveComponent] = useState(null);
  const [taskCount, setTaskCount] = useState(null);
  const taskRemoveTimeoutId = useRef(0);
  const ignoreUpdate = useRef(false);
  const checkIntervalId = useRef(0);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!groups) {
      return;
    }

    if (!groups[0].expanded) {
      groups[0].expanded = !settings.defaultGroupVisible;
      saveTasks(groups);
    }
    updateAllGroupTaskCount(groups);
    countTasks(groups);
    setGroups([...groups]);
  }, [settings]);

  useEffect(() => {
    if (!groups) {
      return;
    }
    if (ignoreUpdate.current) {
      ignoreUpdate.current = false;
      return;
    }
    checkIntervalId.current = setInterval(() => {
      ignoreUpdate.current = true;

      checkGroups(groups);
      updateAllGroupTaskCount(groups);
      setGroups([...groups]);
    }, 30000);

    return () => {
      clearInterval(checkIntervalId.current);
      ignoreUpdate.current = false;
    };
  }, [groups]);

  useEffect(() => {
    clearTimeout(taskRemoveTimeoutId.current);

    if (removedItems.length) {
      taskRemoveTimeoutId.current = setTimeout(() => {
        removeCompletedItems();
      }, 8000);
    }
  }, [removedItems]);

  async function init() {
    const tasks = await chromeStorage.get("tasks");
    const groups = tasks?.length > 0 ? tasks : [getDefaultGroup()];

    initGroups(groups, true);

    chromeStorage.subscribeToChanges(({ tasks }) => {
      if (!tasks) {
        return;
      }

      if (tasks.newValue) {
        initGroups(tasks.newValue, false);
      }
      else {
        setGroups([getDefaultGroup()]);
        setTaskCount(null);
      }
    });
  }

  function initGroups(groups, shouldSave) {
    const modified = checkGroups(groups);

    if (!groups[0].expanded) {
      groups[0].expanded = !settings.defaultGroupVisible;
    }

    setGroups(groups.map(group => {
      if (group.id === "unorganized") {
        group.id = "default";
        group.name = "Default";
      }
      group.tasks.map(task => {
        task = parseTask(task);
        task.subtasks = task.subtasks.map(subtask => {
          subtask = parseTask(subtask);
          return subtask;
        });
        task.labels = task.labels.map(label => {
          label.name ??= label.title;
          delete label.title;
          return label;
        });

        if (task.repeat) {
          task.repeat.history = task.repeat.history.map(item => {
            item.id = getRandomString(4);
            return item;
          });
        }
        return task;
      });
      group.taskCount = getGroupTaskCount(group.tasks);
      return group;
    }));
    countTasks(groups);

    if (shouldSave && modified) {
      saveTasks(groups);
    }
  }

  function getDefaultGroup() {
    return {
      id: "default",
      name: "Default",
      expanded: true,
      tasks: []
    };
  }

  function getTaskRepeatGap(task) {
    let gapInMs = 0;

    if (task.repeat.unit === "day") {
      gapInMs = 24 * 60 * 60 * 1000 * task.repeat.gap;
    }
    else if (task.repeat.unit === "week") {
      gapInMs = 7 * 24 * 60 * 60 * 1000 * task.repeat.gap;
    }
    else if (task.repeat.unit === "month") {
      const creationDate = new Date(task.creationDate);
      let year = creationDate.getFullYear();
      let month = creationDate.getMonth();

      for (let i = 0; i < task.repeat.gap; i += 1) {
        month += 1;

        if (month > 12) {
          year += 1;
          month = 1;
        }
      }
      const day = creationDate.getDate();
      const hours = creationDate.getHours();
      const minutes = creationDate.getMinutes();

      const endMonthDays = new Date(year, month + 1, 0).getDate();
      const nextRepeatDay = Math.min(endMonthDays, day);
      const nextRepeatDate = new Date(year, month, nextRepeatDay, hours, minutes);

      gapInMs = nextRepeatDate - creationDate;
    }
    return gapInMs;
  }

  function updateTaskRepeatProgress(task, diff, gapInMs) {
    let ratio = diff / gapInMs;

    if (ratio < 0) {
      ratio += 1;
    }
    task.repeat.history[task.repeat.history.length - 1].elapsed = ratio * 100;
  }

  function updateTaskRepeatHistory(task, missedCount) {
    task.repeat.number += 1;

    task.repeat.history[task.repeat.history.length - 1] = {
      id: getRandomString(4),
      status: task.repeat.status !== COMPLETED_STATUS ? FAILED_STATUS : task.repeat.status
    };

    task.repeat.status = FAILED_STATUS;

    for (let i = 1; i < missedCount; i += 1) {
      task.repeat.number += 1;

      task.repeat.history.push({
        id: getRandomString(4),
        status: task.repeat.status
      });
    }
    task.repeat.status = IN_PROGRESS_STATUS;
    task.repeat.history.push({
      id: getRandomString(4),
      status: IN_PROGRESS_STATUS,
      elapsed: 0
    });

    if (task.repeat.history.length > 8) {
      task.repeat.history = task.repeat.history.slice(-8);
    }
  }

  function checkGroups(groups) {
    const currentDate = Date.now();
    let modified = false;

    for (const group of groups) {
      const currentTaskCount = group.tasks.length;

      group.tasks = group.tasks.map(task => {
        if (task.repeat) {
          const elapsed = currentDate - task.creationDate;
          const gapInMs = getTaskRepeatGap(task);
          const number = Math.floor(elapsed / gapInMs);
          const totalMs = number > 1 ? gapInMs * number : gapInMs;

          if (elapsed > totalMs) {
            const missedCount = number - task.repeat.number;

            if (missedCount > 0) {
              updateTaskRepeatHistory(task, missedCount);

              delete task.hidden;
              task.subtasks = task.subtasks.map(task => {
                delete task.hidden;
                return task;
              });

              modified = true;
            }
          }
          updateTaskRepeatProgress(task, elapsed - totalMs, gapInMs);
        }
        return task;
      }).filter(task => {
        if (task.expirationDate) {
          return task.expirationDate > currentDate;
        }
        else if (task.repeat?.limit > 0 && task.repeat.number >= task.repeat.limit) {
          return false;
        }
        return true;
      });

      if (!modified) {
        modified = currentTaskCount !== group.tasks.length;
      }
    }
    return modified;
  }

  function parseTask(task) {
    task.id = getRandomString();
    task.rawText ??= task.text;
    task.rawText = task.rawText.replace(/<(.+?)>/g, (_, g1) => `&lt;${g1}&gt;`);
    task.text = replaceLink(task.rawText);

    if (task.expirationDate) {
      const { dateLocale } = getSetting("timeDate");

      task.expirationDateString = formatDate(task.expirationDate, {
        locale: dateLocale,
        includeTime: true
      });
    }
    return task;
  }

  function removeTask(groupIndex, taskIndex) {
    groups[groupIndex].tasks[taskIndex].removed = true;

    setGroups([...groups]);
    setRemovedItems([...removedItems, { groupIndex, taskIndex }]);
  }

  function removeSubtask(groupIndex, taskIndex, subtaskIndex) {
    groups[groupIndex].tasks[taskIndex].subtasks[subtaskIndex].removed = true;

    setGroups([...groups]);
    setRemovedItems([...removedItems, { groupIndex, taskIndex, subtaskIndex }]);
  }

  function setRepeatingTaskStatus(task, status) {
    task.repeat.status = status;
    task.repeat.history[task.repeat.history.length - 1].status = status;
  }

  function removeCompletedItems() {
    for (const group of groups) {
      group.tasks = group.tasks.map(task => {
        if (task.repeat) {
          if (task.removed) {
            delete task.removed;
            task.hidden = true;
            setRepeatingTaskStatus(task, COMPLETED_STATUS);
            return task;
          }
          task.subtasks = task.subtasks.map(subtask => {
            if (subtask.removed) {
              delete subtask.removed;
              subtask.hidden = true;
              setRepeatingTaskStatus(task, PARTIAL_STATUS);
            }
            return subtask;
          });
        }
        return task;
      }).filter(task => {
        if (task.repeat) {
          return true;
        }
        task.subtasks = task.subtasks.filter(subtask => !subtask.removed);
        return !task.removed;
      });
      group.taskCount = getGroupTaskCount(group.tasks);
    }
    setGroups([...groups]);
    setRemovedItems([]);
    countTasks(groups);
    saveTasks(groups);
  }

  function undoRemovedTasks() {
    for (const { groupIndex, taskIndex, subtaskIndex } of removedItems) {
      const task = groups[groupIndex].tasks[taskIndex];

      if (subtaskIndex >= 0) {
        delete task.subtasks[subtaskIndex].removed;
      }
      else {
        delete task.removed;
      }
    }
    setGroups([...groups]);
    setRemovedItems([]);
  }

  function editTask(groupIndex, taskIndex) {
    const group = groups[groupIndex];
    const { id, rawText, subtasks, creationDate, expirationDate, repeat } = group.tasks[taskIndex];

    setActiveComponent("form");
    setForm({
      updating: true,
      groupIndex,
      taskIndex,
      groupId: group.id,
      selectedGroupId: group.id,
      task: {
        id,
        rawText,
        subtasks,
        creationDate,
        expirationDate,
        repeat
      }
    });
  }

  function removeFormTask() {
    removeTask(form.groupIndex, form.taskIndex);
    hideForm();
  }

  function replaceLink(text) {
    const regex = /(http|https):\/\/[a-zA-Z0-9\-.]+\.[a-zA-Z]{2,}(\/\S*)?/g;
    return text.replace(regex, href => `<a href="${href}" class="task-link" target="_blank">${href}</a>`);
  }

  function toggleGroupVisibility(group) {
    group.expanded = !group.expanded;

    setGroups([ ...groups ]);
    saveTasks(groups);
  }

  function showForm() {
    setActiveComponent("form");
    setForm({});
  }

  function hideForm() {
    setActiveComponent(null);
    setForm(null);
  }

  function showGroups() {
    setActiveComponent("groups");
  }

  function createGroup(group) {
    // Insert new group after the default group
    groups.splice(1, 0, group);
    updateGroups(groups);
  }

  function hideActiveComponent() {
    setActiveComponent(null);
  }

  function cleanupTask(task) {
    delete task.id;
    delete task.text;
    delete task.removed;
    delete task.expirationDateString;
    return task;
  }

  async function saveTasks(groups) {
    chromeStorage.set({ tasks: structuredClone(groups).map(group => {
      group.tasks = group.tasks.map(task => {
        task = cleanupTask(task);
        task.subtasks = task.subtasks.map(cleanupTask);

        if (task.repeat) {
          task.repeat.history = task.repeat.history.map(item => {
            delete item.id;
            delete item.elapsed;
            return item;
          });
        }
        return task;
      });
      return group;
    })});
  }

  function updateGroups(groups, shouldSave = true) {
    updateAllGroupTaskCount(groups);
    countTasks(groups);
    setGroups([...groups]);

    if (shouldSave) {
      saveTasks(groups);
    }
  }

  function updateAllGroupTaskCount(groups) {
    for (const group of groups) {
      group.taskCount = getGroupTaskCount(group.tasks);
    }
  }

  function getAllSubtaskCount(tasks) {
    let total = 0;

    for (const task of tasks) {
      total += getSubtaskCount(task);
    }
    return total;
  }

  function getSubtaskCount(task) {
    return task.subtasks.reduce((total, task) => {
      if (task.hidden) {
        if (settings.showCompletedRepeatingTasks) {
          return total + 1;
        }
        return total;
      }
      return total + 1;
    }, 0);
  }

  function getGroupTaskCount(tasks) {
    const completedTaskCount = countCompletedTasks(tasks);
    let subtaskCount = 0;

    if (settings.countSubtasks) {
      subtaskCount = getAllSubtaskCount(tasks);
    }
    return tasks.length + subtaskCount - completedTaskCount;
  }

  function countCompletedTasks(tasks) {
    return settings.showCompletedRepeatingTasks ? 0 : tasks.reduce((total, task) => {
      if (task.hidden) {
        total += 1;
      }
      return total;
    }, 0);
  }

  function countTasks(groups) {
    let count = 0;

    for (const group of groups) {
      const completedTaskCount = countCompletedTasks(group.tasks);

      count += group.tasks.length;
      count -= completedTaskCount;
    }
    setTaskCount(count);
  }

  function renderExpirationIndicator(task) {
    const full = task.expirationDate - task.creationDate;
    const partial = task.expirationDate - Date.now();
    const dashoffset = 200 - 25 * (1 - partial / full);

    return (
      <svg className="task-expiration-indicator">
        <title>Expires on {task.expirationDateString}</title>
        <circle cx="8" cy="8" r="4" strokeDasharray="100"
          className="task-expiration-indicator-visual"
          style={{ "--dashoffset": dashoffset }}/>
      </svg>
    );
  }

  if (!groups) {
    return null;
  }

  if (activeComponent === "form") {
    return (
      <Suspense fallback={null}>
        <Form form={form} groups={groups} updateGroups={updateGroups} replaceLink={replaceLink} removeTask={removeFormTask}
          createGroup={createGroup} hide={hideForm}/>
      </Suspense>
    );
  }
  else if (activeComponent === "groups") {
    return (
      <Suspense fallback={null}>
        <Groups groups={groups} updateGroups={updateGroups} createGroup={createGroup} hide={hideActiveComponent}/>
      </Suspense>
    );
  }
  return (
    <>
      <div className="container-header">
        <Dropdown>
          <button className="btn icon-text-btn dropdown-btn" onClick={showGroups}>
            <Icon id="menu"/>
            <span>Groups</span>
          </button>
          <button className="btn icon-text-btn dropdown-btn" onClick={toggleSize} title={expanded ? "Shrink" : "Expand"}>
            <Icon id={`vertical-${expanded ? "shrink" : "expand"}`}/>
            <span>{expanded ? "Shrink" : "Expand"}</span>
          </button>
        </Dropdown>
      </div>
      <div className={`container-body tasks-body${removedItems.length > 0 ? " dialog-visible" : ""}`}>
        {taskCount > 0 ? (
          <ul className="tasks-groups-container">
            {groups.map((group, groupIndex) => (group.taskCount === 0 && settings.emptyGroupsHidden ? null : (
              <li key={group.id}>
                {(groupIndex > 0 || settings.defaultGroupVisible) && (
                  <button className={`btn icon-btn tasks-groups-item tasks-groups-item-toggle-btn${group.expanded ? " expanded" : ""}`}
                    onClick={() => toggleGroupVisibility(group)}
                    disabled={!group.taskCount}
                    title={group.taskCount > 0 ? group.expanded ? "Collapse" : "Expand" : ""}>
                    <span className="tasks-group-count">{group.taskCount}</span>
                    <span className="tasks-group-title">{group.name}</span>
                    {group.taskCount > 0 && (
                      <Icon id="chevron-down" className="tasks-group-icon"/>
                    )}
                  </button>
                )}
                {group.expanded && (
                  <ul>
                    {group.tasks.map((task, taskIndex) => (
                      !settings.showCompletedRepeatingTasks && task.hidden ? null : (
                        <li className={`task${task.removed ? " removed" : ""}`} key={task.id}>
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
                                  onClick={() => removeTask(groupIndex, taskIndex)} title="Complete">
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
                                            onClick={() => removeSubtask(groupIndex, taskIndex, subtaskIndex)} title="Complete">
                                            <div className="checkbox-tick"></div>
                                          </button>
                                        )}
                                        <span className="task-text" dangerouslySetInnerHTML={{ __html: subtask.text }}></span>
                                      </div>
                                    </li>
                                  )
                                ))}
                              </ul>
                            )}
                            <button className="btn icon-btn alt-icon-btn task-edit-btn"
                              onClick={() => editTask(groupIndex, taskIndex)} title="Edit">
                              <Icon id="edit"/>
                            </button>
                            {task.expirationDate ? renderExpirationIndicator(task) : null}
                            {!settings.repeatHistoryHidden && task.repeat?.history.length ? (
                              <div className="task-repeat-history">
                                {task.repeat.history.map(item => (
                                  <div className={`task-repeat-history-item${item.status > 0 ? ` ${taskStatusMap[item.status]}` : ""}`}
                                    key={item.id}>
                                    {item.elapsed > 0 ? (
                                      <div className="task-repeat-history-item-inner" style={{ "--elapsed" : item.elapsed }}></div>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </li>
                      )
                    ))}
                  </ul>
                )}
              </li>
            )))}
          </ul>
        ) : (
          <p className="tasks-message">No tasks</p>
        )}
        <CreateButton className="tasks-create-btn" onClick={showForm} trackScroll></CreateButton>
      </div>
      {removedItems.length > 0 && (
        <div className="container-footer tasks-dialog">
          <span>Removed <span className="tasks-dialog-count">{removedItems.length}</span> task{removedItems.length > 1 ? "s" : ""}</span>
          <button className="btn text-btn" onClick={undoRemovedTasks}>UNDO</button>
        </div>
      )}
    </>
  );
}
