import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { getRandomString, timeout, replaceLink } from "utils";
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

export default function Tasks({ settings, locale, expanded, toggleSize }) {
  const [groups, setGroups] = useState(null);
  const [removedItems, setRemovedItems] = useState([]);
  const [form, setForm] = useState(null);
  const [activeComponent, setActiveComponent] = useState(null);
  const [taskCount, setTaskCount] = useState(null);
  const taskRemoveTimeoutId = useRef(0);
  const ignoreUpdate = useRef(false);
  const checkIntervalId = useRef(0);
  const groupToggleTimeoutId = useRef(0);

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

  function updateTaskRepeatProgress(task, prev, current, next) {
    const elapsed = current - prev;
    const total = next - prev;
    const ratio = elapsed / total;
    const { dateLocale } = getSetting("timeDate");
    const dateString = formatDate(next, {
      locale: dateLocale,
      includeTime: true
    });
    const historyItem = task.repeat.history.at(-1);

    historyItem.dateString = `Resets on ${dateString}`;
    historyItem.elapsed = ratio * 100;
  }

  function updateTaskRepeatHistory(task, missedCount) {
    const lastItem = task.repeat.history.at(-1);

    task.repeat.number += missedCount;
    task.repeat.history[task.repeat.history.length - 1] = {
      id: getRandomString(4),
      status: lastItem.status !== COMPLETED_STATUS ? FAILED_STATUS : lastItem.status
    };

    for (let i = 1; i < missedCount; i += 1) {
      task.repeat.history.push({
        id: getRandomString(4),
        status: FAILED_STATUS
      });
    }
    task.repeat.history.push({
      id: getRandomString(4),
      status: IN_PROGRESS_STATUS,
      elapsed: 0
    });

    if (task.repeat.history.length > 8) {
      task.repeat.history = task.repeat.history.slice(-8);
    }
  }

  function getMonthGap(task, start) {
    const startDate = new Date(start);
    let year = startDate.getFullYear();
    let month = startDate.getMonth();
    const day = startDate.getDate();
    const hours = startDate.getHours();
    const minutes = startDate.getMinutes();

    for (let i = 0; i < task.repeat.gap; i += 1) {
      month += 1;

      if (month > 11) {
        year += 1;
        month = 0;
      }
    }
    const endDate = new Date(year, month, day, hours, minutes);
    const endMonthDays = new Date(year, month + 1, 0).getDate();
    const endDateDays = Math.min(endMonthDays, day);

    return new Date(endDate.getFullYear(), endDate.getMonth(), endDateDays).getTime() - start;
  }

  function getRepeatStatus(task, current) {
    const { start } = task.repeat;

    if (task.repeat.unit === "day" || task.repeat.unit === "week") {
      let gap = 24 * 60 * 60 * 1000 * task.repeat.gap;

      if (task.repeat.unit === "week") {
        gap *= 7;
      }
      const nextDateFull = new Date(start + gap);
      let next = new Date(nextDateFull.getFullYear(), nextDateFull.getMonth(), nextDateFull.getDate()).getTime();
      let prev = start;
      let missed = 0;

      while (next < current) {
        prev = next;
        missed += 1;
        next += gap;
      }

      return {
        missed,
        prevDate: prev,
        nextDate: next
      };
    }
    else if (task.repeat.unit === "month") {
      let next = start + getMonthGap(task, start);
      let prev = start;
      let missed = 0;

      while (next < current) {
        prev = next;
        missed += 1;
        next += getMonthGap(task, next);
      }

      return {
        missed,
        prevDate: prev,
        nextDate: next
      };
    }
    throw new Error("Invalid task repeat unit.");
  }

  function checkGroups(groups) {
    const currentDate = Date.now();
    let modified = false;

    for (const group of groups) {
      const currentTaskCount = group.tasks.length;

      group.tasks = group.tasks.map(task => {
        if (task.repeat) {
          task.repeat.start ??= task.creationDate;
          const { missed, prevDate, nextDate } = getRepeatStatus(task, currentDate);

          if (missed > 0) {
            updateTaskRepeatHistory(task, missed);

            delete task.hidden;
            task.subtasks = task.subtasks.map(task => {
              delete task.hidden;
              return task;
            });

            task.repeat.start = prevDate;
            modified = true;
          }
          updateTaskRepeatProgress(task, prevDate, currentDate, nextDate);
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
    task.text = replaceLink(task.rawText, "task-link");

    if (task.expirationDate) {
      const { dateLocale } = getSetting("timeDate");

      task.expirationDateString = formatDate(task.expirationDate, {
        locale: dateLocale,
        includeTime: true
      });
    }
    return task;
  }

  function removeTask(groupIndex, taskIndex, removedThroughForm = false) {
    const task = groups[groupIndex].tasks[taskIndex];

    task.removed = true;
    task.removedThroughForm = removedThroughForm;

    setGroups([...groups]);
    setRemovedItems([...removedItems, { groupIndex, taskIndex }]);
  }

  function removeSubtask(groupIndex, taskIndex, subtaskIndex) {
    groups[groupIndex].tasks[taskIndex].subtasks[subtaskIndex].removed = true;

    setGroups([...groups]);
    setRemovedItems([...removedItems, { groupIndex, taskIndex, subtaskIndex }]);
  }

  function setRepeatingTaskStatus(task, status) {
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
          return !task.removedThroughForm;
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
        delete task.removedThroughForm;
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
    removeTask(form.groupIndex, form.taskIndex, true);
    hideForm();
  }

  function toggleGroupVisibility(group) {
    const { animationSpeed } = getSetting("appearance");

    if (group.expanded) {
      group.state = "collapsing";
    }
    else {
      group.state = "expanding";
      group.expanded = true;
    }

    groupToggleTimeoutId.current = timeout(() => {
      if (group.state === "collapsing") {
        group.expanded = false;
      }
      delete group.state;

      setGroups([ ...groups ]);
      saveTasks(groups);
    }, 200 * animationSpeed, groupToggleTimeoutId.current);

    setGroups([ ...groups ]);
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
      delete group.state;
      group.tasks = group.tasks.map(task => {
        task = cleanupTask(task);
        task.subtasks = task.subtasks.map(cleanupTask);

        if (task.repeat) {
          task.repeat.history = task.repeat.history.map(item => {
            delete item.id;
            delete item.elapsed;
            delete item.dateString;
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
        <Form form={form} groups={groups} locale={locale} updateGroups={updateGroups} removeTask={removeFormTask}
          createGroup={createGroup} hide={hideForm}/>
      </Suspense>
    );
  }
  else if (activeComponent === "groups") {
    return (
      <Suspense fallback={null}>
        <Groups groups={groups} locale={locale} updateGroups={updateGroups} createGroup={createGroup} hide={hideActiveComponent}/>
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
          <button className="btn icon-text-btn dropdown-btn" onClick={toggleSize}>
            <Icon id={`vertical-${expanded ? "shrink" : "expand"}`}/>
            <span>{expanded ? locale.global.shrink : locale.global.expand}</span>
          </button>
        </Dropdown>
      </div>
      <div className={`container-body tasks-body${removedItems.length > 0 ? " dialog-visible" : ""}`}>
        {taskCount > 0 ? (
          <ul className="tasks-groups-container">
            {groups.map((group, groupIndex) => (group.taskCount === 0 && settings.emptyGroupsHidden ? null : (
              <li key={group.id} className="tasks-group">
                {(groupIndex > 0 || settings.defaultGroupVisible) && (
                  <button className={`btn icon-btn tasks-groups-item tasks-groups-item-toggle-btn${group.expanded ? " expanded" : ""}`}
                    onClick={() => toggleGroupVisibility(group)}
                    disabled={!group.taskCount}
                    title={group.taskCount > 0 ? group.expanded ? locale.global.collapse : locale.global.expand : ""}>
                    <span className="tasks-group-count">{group.taskCount}</span>
                    <span className="tasks-group-title">{group.name}</span>
                    {group.taskCount > 0 && (
                      <Icon id="chevron-down" className="tasks-group-icon"/>
                    )}
                  </button>
                )}
                {group.expanded && (
                  <ul className={`tasks-group-items${group.state ? ` ${group.state}` : ""}`}>
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
                            {task.expirationDate ? renderExpirationIndicator(task) : null}
                            {!settings.repeatHistoryHidden && task.repeat?.history.length ? (
                              <div className="task-repeat-history">
                                {task.repeat.history.map(item => (
                                  <div className={`task-repeat-history-item${item.status > 0 ? ` ${taskStatusMap[item.status]}` : ""}`}
                                    title={item.dateString} key={item.id}>
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
          <p className="tasks-message">{locale.tasks.no_tasks}</p>
        )}
        <CreateButton className="tasks-create-btn" onClick={showForm} trackScroll></CreateButton>
      </div>
      {removedItems.length > 0 && (
        <div className="container-footer tasks-dialog">
          <span>Removed <span className="tasks-dialog-count">{removedItems.length}</span> task{removedItems.length > 1 ? "s" : ""}</span>
          <button className="btn text-btn" onClick={undoRemovedTasks}>{locale.tasks.undo}</button>
        </div>
      )}
    </>
  );
}
