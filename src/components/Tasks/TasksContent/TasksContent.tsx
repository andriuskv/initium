import type { AppearanceSettings, GeneralSettings, TasksSettings, TimeDateSettings } from "types/settings";
import type { Group, Label, TaskRepeat, TaskRepeatHistory, TaskType, Subtask, TaskForm } from "../tasks.type";
import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { getRandomString, timeout, replaceLink } from "utils";
import * as chromeStorage from "services/chromeStorage";
import { getSetting } from "services/settings";
import { formatDate, getDSTChangeDirection } from "services/timeDate";
import Icon from "components/Icon";
import CreateButton from "components/CreateButton";
import Toast from "components/Toast";
import Spinner from "components/Spinner";
import "./tasks-content.css";
import Task from "./Task";
import Header from "./Header/Header";
import Footer from "./Footer/Footer";
import { findSubtask, traverseSubtasks } from "../helpers";

const Form = lazy(() => import("./Form"));
const Groups = lazy(() => import("./Groups"));

const IN_PROGRESS_STATUS = 0;
const FAILED_STATUS = 1;
const PARTIAL_STATUS = 2;
const COMPLETED_STATUS = 3;

type Props = {
  settings: TasksSettings,
  generalSettings: GeneralSettings,
  locale: any,
  expanded: boolean,
  toggleSize: () => void
}

// TODO: fix tests

export default function Tasks({ settings, generalSettings, locale, expanded, toggleSize }: Props) {
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [removedItemCount, setRemovedItemCount] = useState(0);
  const [form, setForm] = useState<TaskForm | null>(null);
  const [activeComponent, setActiveComponent] = useState<"form" | "groups" | "">("");
  const [taskCount, setTaskCount] = useState(0);
  const [storageWarning, setStorageWarning] = useState<{ message: string } | null>(null);
  const taskRemoveTimeoutId = useRef(0);
  const groupToggleTimeoutId = useRef(0);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!groups) {
      return;
    }
    let newGroups = updateAllGroupTaskCount(groups);

    if (!newGroups[0].expanded) {
      newGroups = newGroups.with(0, {
        ...newGroups[0],
        expanded: !settings.defaultGroupVisible
      });
      saveTasks(newGroups);
    }
    countTasks(newGroups);
    setGroups(newGroups);
  }, [settings]);

  useEffect(() => {
    if (!groups) {
      return;
    }

    for (const group of groups) {
      for (const task of group.tasks) {
        task.text = replaceLink(task.rawText, "task-link", generalSettings.openLinkInNewTab);

        for (const subtask of task.subtasks) {
          subtask.text = replaceLink(subtask.rawText, "task-link", generalSettings.openLinkInNewTab);
        }
      }
    }
    setGroups([...groups]);
  }, [generalSettings.openLinkInNewTab]);

  useEffect(() => {
    if (!groups) {
      return;
    }
    function handleTimeDateChange(event: CustomEventInit) {
      if (event.detail.unit === "minutes" && groups) {
        checkGroups(groups);
        const newGroups = updateAllGroupTaskCount(groups);
        setGroups(newGroups);
      }
    }

    window.addEventListener("timedate-change", handleTimeDateChange);

    return () => {
      window.removeEventListener("timedate-change", handleTimeDateChange);
    };
  }, [groups]);

  useEffect(() => {
    clearTimeout(taskRemoveTimeoutId.current);

    if (removedItemCount > 0) {
      taskRemoveTimeoutId.current = window.setTimeout(() => {
        removeCompletedItems();
      }, 8000);
    }
  }, [removedItemCount]);

  async function init() {
    const tasks = await chromeStorage.get("tasks") as Group[];
    const groups = tasks?.length > 0 ? tasks : [getDefaultGroup()];

    initGroups(groups, true);

    chromeStorage.subscribeToChanges(({ tasks }) => {
      if (!tasks) {
        return;
      }

      if (tasks.newValue) {
        initGroups(tasks.newValue as Group[], false);
      }
      else {
        setGroups([getDefaultGroup()]);
        setTaskCount(0);
      }
    });
  }

  function initGroups(groups: Group[], shouldSave: boolean) {
    let modified = checkGroups(groups);

    setGroups(groups.map((group, index) => {
      if (index === 0 && !group.expanded) {
        group.expanded = !settings.defaultGroupVisible;
      }

      if (group.id === "unorganized") {
        group.id = "default";
        group.name = "Default";
        modified = true;
      }
      group.tasks = group.tasks.map(task => {
        task = parseTask(task) as TaskType;
        task.subtasks = traverseSubtasks(task, "", ({ subtask }) => {
          return parseBaseTask(subtask);
        });
        task.labels = task.labels.map(label => {
          label.id = getRandomString(4);
          return label;
        });

        if (task.repeat?.history) {
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

  function getDefaultGroup(): Group {
    return {
      id: "default",
      name: locale.global.default,
      expanded: true,
      taskCount: 0,
      tasks: []
    };
  }

  function updateTaskRepeatProgress(task: TaskType, prev: number, current: number, next: number) {
    const elapsed = current - prev;
    const total = next - prev;
    const ratio = elapsed / total;
    const { dateLocale } = getSetting("timeDate") as TimeDateSettings;
    const dateString = formatDate(next, {
      locale: dateLocale,
      includeTime: true
    });

    if (task.repeat?.history) {
      const historyItem = task.repeat.history.at(-1)!;

      historyItem.dateString = `Resets on ${dateString}`;
      historyItem.elapsed = ratio * 100;
    }
  }

  function updateTaskRepeatHistory(task: TaskType, missedCount: number) {
    if (!task.repeat || !task.repeat.history) {
      return;
    }
    const lastItem = task.repeat.history.at(-1)!;

    task.repeat.number = task.repeat.number ? task.repeat.number + missedCount : missedCount;
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

  function getMonthGap(repeatGap: number, start: number) {
    const startDate = new Date(start);
    let year = startDate.getFullYear();
    let month = startDate.getMonth();
    const day = startDate.getDate();
    const hours = startDate.getHours();
    const minutes = startDate.getMinutes();

    for (let i = 0; i < repeatGap; i += 1) {
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

  function getRepeatStatus(taskRepeat: TaskRepeat, current: number) {
    const { start } = taskRepeat;
    const hourInMs = 60 * 60 * 1000;

    if (taskRepeat.unit === "day" || taskRepeat.unit === "week") {
      let gap = 24 * hourInMs * taskRepeat.gap;

      if (taskRepeat.unit === "week") {
        gap *= 7;
      }
      const direction = getDSTChangeDirection(start, current);
      const offset = direction === 0 ? 0 : -1 * direction * hourInMs;
      const nextDateFull = new Date(start + gap);
      let next = new Date(nextDateFull.getFullYear(), nextDateFull.getMonth(), nextDateFull.getDate()).getTime() + offset;
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
    else if (taskRepeat?.unit === "month") {
      let next = start + getMonthGap(taskRepeat.gap, start);
      let prev = start;
      let missed = 0;

      while (next < current) {
        prev = next;
        missed += 1;
        next += getMonthGap(taskRepeat.gap, next);
      }

      return {
        missed,
        prevDate: prev,
        nextDate: next
      };
    }
    throw new Error("Invalid task repeat unit.");
  }

  function checkGroups(groups: Group[]) {
    const currentDate = Date.now();
    let modified = false;

    for (const group of groups) {
      const currentTaskCount = group.tasks.length;

      group.tasks = group.tasks.map(task => {
        if (task.repeat) {
          task.repeat.start ??= task.creationDate;
          const { missed, prevDate, nextDate } = getRepeatStatus(task.repeat, currentDate);

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
        else if (task.repeat && (task.repeat.limit > 0 && task.repeat.number >= task.repeat.limit)) {
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

  function parseBaseTask(task: TaskType | Subtask) {
    task.id = getRandomString();
    task.text = task.rawText.replace(/<(.+?)>/g, (_, g1) => `&lt;${g1}&gt;`);
    task.text = replaceLink(task.text, "task-link", generalSettings.openLinkInNewTab);
    return task;
  }

  function parseTask(task: TaskType) {
    task = parseBaseTask(task) as TaskType;

    if (task.expirationDate) {
      const { dateLocale } = getSetting("timeDate") as TimeDateSettings;

      task.expirationDateString = formatDate(task.expirationDate, {
        locale: dateLocale,
        includeTime: true
      });
    }
    return task;
  }

  function removeTask(groupId: string, taskId: string, removedThroughForm = false) {
    if (!groups) {
      return;
    }
    const groupIndex = groups.findIndex(group => group.id === groupId);
    const group = groups[groupIndex];
    const taskIndex = group.tasks.findIndex(task => task.id === taskId);
    const task = group.tasks[taskIndex];
    const removedTaskCount = group.tasks.reduce((total, task) => {
      if (task.removed) {
        total += 1;
      }
      return total;
    }, 1);

    const newGroups = groups.with(groupIndex, {
      ...group,
      hiding: removedTaskCount === group.tasks.length,
      tasks: group.tasks.with(taskIndex, {
        ...task,
        removed: true,
        removedThroughForm
      })
    });

    setGroups(newGroups);
    setRemovedItemCount(removedItemCount + 1);
  }

  function recursiveRemoveTask(task: TaskType, subtaskId: string): Subtask[] {
    if (subtaskId === task.id) {
      return task.subtasks;
    }
    const result = findSubtask(task, subtaskId);

    if (!result) {
      return task.subtasks;
    }
    const { parentTask, subtask, index } = result;
    let requiredSubtaskCount = 0;

    for (const subtask of parentTask.subtasks!) {
      if (!subtask.optional && !(subtask.removed || subtask.hidden)) {
        requiredSubtaskCount += 1;
      }
    }

    if (requiredSubtaskCount === 0) {
      parentTask.subtasks = parentTask.subtasks!.with(index, {
        ...subtask,
        removed: false
      });
      parentTask.removed = true;

      return recursiveRemoveTask(task, parentTask.id);
    }
    return task.subtasks;
  }

  function removeSubtask(group: Group, task: TaskType, subtaskId: string) {
    if (!groups) {
      return;
    }
    const groupIndex = groups.findIndex(g => g.id === group.id);
    const taskIndex = groups[groupIndex].tasks.findIndex(t => t.id === task.id);
    const newTask = {
      ...task,
      subtasks: traverseSubtasks(task, subtaskId, ({ parentTask, subtask, index }) => {
        return parentTask.subtasks?.with(index, { ...subtask, removed: true });
      })
    };

    if (newTask.completeWithSubtasks) {
      newTask.subtasks = recursiveRemoveTask(newTask, subtaskId);
    }

    setGroups(groups.with(groupIndex, {
      ...group,
      tasks: group.tasks.with(taskIndex, newTask)
    }));
    setRemovedItemCount(removedItemCount + 1);
  }

  function setRepeatingTaskStatus(task: TaskType, status: number) {
    if (task.repeat?.history) {
      task.repeat.history[task.repeat.history.length - 1].status = status;
    }
  }

  function removeCompletedItems() {
    if (!groups) {
      return;
    }

    for (const group of groups) {
      delete group.hiding;
      group.tasks = group.tasks.map(task => {
        if (task.repeat) {
          if (task.removed) {
            delete task.removed;
            task.hidden = true;
            task.subtasks = traverseSubtasks(task, "", ({ subtask }) => {
              delete subtask.removed;
              subtask.hidden = true;
              return subtask;
            });
            setRepeatingTaskStatus(task, COMPLETED_STATUS);
            return task;
          }
          task.subtasks = traverseSubtasks(task, "", ({ subtask }) => {
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
        task.subtasks = traverseSubtasks(task, "", ({ subtask }) => {
          if (subtask.removed) {
            return;
          }
          return subtask;
        });
        return !task.removed;
      });
      group.taskCount = getGroupTaskCount(group.tasks);
    }
    setGroups([...groups]);
    setRemovedItemCount(0);
    countTasks(groups);
    saveTasks(groups);
  }

  function undoRemovedTasks() {
    if (!groups) {
      return;
    }
    const newGroups = groups.map(group => {
      return {
        ...group,
        hiding: false,
        tasks: group.tasks.map(task => {
          task.removed = false;
          task.removedThroughForm = false;
          task.subtasks = traverseSubtasks(task, "", ({ subtask }) => {
            delete subtask.removed;
            return subtask;
          });
          return task;
        })
      }
    });
    setGroups(newGroups);
    setRemovedItemCount(0);
  }

  function editTask(groupId: string, taskId: string) {
    setActiveComponent("form");
    setForm({
      updating: true,
      taskId,
      groupId
    });
  }

  function removeFormTask() {
    if (form?.groupId && form?.taskId) {
      removeTask(form.groupId, form.taskId, true);
    }
    hideForm();
  }

  function toggleGroupVisibility(group: Group, index: number) {
    if (!groups) {
      return;
    }
    const { animationSpeed } = getSetting("appearance") as AppearanceSettings;
    const newGroup = { ...group };

    if (newGroup.expanded) {
      newGroup.state = "collapsing";
    }
    else {
      newGroup.state = "expanding";
      newGroup.expanded = true;
    }
    groupToggleTimeoutId.current = timeout(() => {
      if (!groups) {
        return;
      }

      if (newGroup.state === "collapsing") {
        newGroup.expanded = false;
      }
      delete newGroup.state;

      const newGroups = groups.with(index, newGroup);

      setGroups(newGroups);
      saveTasks(newGroups);
    }, 200 * animationSpeed, groupToggleTimeoutId.current);
    setGroups(groups.with(index, newGroup));
  }

  function showForm() {
    setActiveComponent("form");
    setForm({} as TaskForm);
  }

  function hideForm() {
    setActiveComponent("");
    setForm(null);
  }

  function showGroups() {
    setActiveComponent("groups");
  }

  function createGroup(group: Group) {
    if (!groups) {
      return;
    }
    // Insert new group after the default group
    updateGroups(groups.toSpliced(1, 0, group));
  }

  function editGroup(group: Group) {
    if (!groups) {
      return;
    }
    const oldGroupIndex = groups.findIndex(({ id }) => group.id === id);
    updateGroups(groups.with(oldGroupIndex, group));
  }

  function hideActiveComponent() {
    setActiveComponent("");
  }

  function cleanupTask(task: Partial<TaskType>) {
    delete task.id;
    delete task.text;
    delete task.removed;
    delete task.expirationDateString;
    delete task.removedThroughForm;
    return task;
  }

  function cleanupSubtask(task: Partial<Subtask>) {
    delete task.id;
    delete task.text;
    delete task.removed;

    if (typeof task.optional === "undefined") {
      delete task.optional;
    }
    return task;
  }

  async function saveTasks(groups: Partial<Group>[]) {
    const data = await chromeStorage.set({
      tasks: structuredClone(groups).map(group => {
        delete group.state;
        delete group.hiding;
        delete group.taskCount;

        group.tasks = group.tasks?.map(task => {
          const cleanTask = cleanupTask(task);

          cleanTask.subtasks = traverseSubtasks(task, "", ({ subtask }) => {
            return cleanupSubtask(subtask) as Subtask;
          });
          cleanTask.labels = (task.labels as Partial<Label>[]).map(label => {
            delete label.id;
            return label;
          }) as Label[];

          if (cleanTask.repeat?.history) {
            cleanTask.repeat.history = (cleanTask.repeat.history as Partial<TaskRepeatHistory>[]).map(item => {
              delete item.id;
              delete item.elapsed;
              delete item.dateString;
              return item;
            }) as TaskRepeatHistory[];
          }
          return cleanTask;
        }) as TaskType[];
        return group;
      })
    }, { warnSize: true });

    if (data?.usedRatio === 1 && data?.message) {
      setStorageWarning({ message: data.message });
    }
    else {
      setStorageWarning(null);
    }
  }

  function updateGroups(groups: Group[], shouldSave = true) {
    const newGroups = updateAllGroupTaskCount(groups);
    countTasks(newGroups);
    setGroups(newGroups);

    if (shouldSave) {
      saveTasks(newGroups);
    }
  }

  function replaceGroups(items: { index: number, group: Group }[], shouldSave = true) {
    if (!groups) {
      return;
    }
    let newGroups = groups;

    for (const item of items) {
      newGroups = newGroups.with(item.index, item.group);
    }
    newGroups = updateAllGroupTaskCount(newGroups);
    countTasks(newGroups);
    setGroups(newGroups);

    if (shouldSave) {
      saveTasks(newGroups);
    }
  }

  function updateAllGroupTaskCount(groups: Group[]) {
    return groups.map(group => {
      group.taskCount = getGroupTaskCount(group.tasks);
      return group;
    });
  }

  function getAllSubtaskCount(tasks: TaskType[]) {
    let total = 0;

    for (const task of tasks) {
      total += getSubtaskCount(task);
    }
    return total;
  }

  function getSubtaskCount(task: TaskType) {
    let count = 0;

    traverseSubtasks(task, "", ({ subtask }) => {
      if (!subtask.hidden || (subtask.hidden && settings.showCompletedRepeatingTasks)) {
        count += 1;
      }
      return subtask;
    });
    return count;
  }

  function getGroupTaskCount(tasks: TaskType[]) {
    const completedTaskCount = countCompletedTasks(tasks);
    let subtaskCount = 0;

    if (settings.countSubtasks) {
      subtaskCount = getAllSubtaskCount(tasks);
    }
    return tasks.length + subtaskCount - completedTaskCount;
  }

  function countCompletedTasks(tasks: TaskType[]) {
    return settings.showCompletedRepeatingTasks ? 0 : tasks.reduce((total, task) => {
      if (task.hidden) {
        total += 1;
      }
      return total;
    }, 0);
  }

  function countTasks(groups: Group[]) {
    let count = 0;

    for (const group of groups) {
      const completedTaskCount = countCompletedTasks(group.tasks);

      count += group.tasks.length;
      count -= completedTaskCount;
    }
    setTaskCount(count);
  }

  function dismissStorageWarning() {
    setStorageWarning(null);
  }

  if (!groups) {
    return null;
  }

  if (activeComponent === "form" && form) {
    return (
      <Suspense fallback={<Spinner />}>
        <Form form={form} groups={groups} locale={locale} replaceGroups={replaceGroups} removeTask={removeFormTask}
          createGroup={createGroup} hide={hideForm} />
      </Suspense>
    );
  }
  else if (activeComponent === "groups") {
    return (
      <Suspense fallback={<Spinner />}>
        <Groups groups={groups} locale={locale} updateGroups={updateGroups} createGroup={createGroup} editGroup={editGroup} hide={hideActiveComponent} />
      </Suspense>
    );
  }

  return (
    <>
      <Header locale={locale} expanded={expanded} toggleSize={toggleSize} showGroups={showGroups} />
      <div className={`container-body tasks-body${removedItemCount > 0 ? " dialog-visible" : ""}`}>
        {taskCount > 0 ? (
          <ul className="tasks-groups-container">
            {groups.map((group, groupIndex) => (group.taskCount === 0 && settings.emptyGroupsHidden ? null : (
              <li key={group.id} className="tasks-group" style={{ "--group-color": group.color } as React.CSSProperties}>
                {(groupIndex > 0 || settings.defaultGroupVisible) && (
                  <button className={`btn icon-btn tasks-groups-item tasks-groups-item-toggle-btn${group.expanded ? " expanded" : ""}`}
                    onClick={() => toggleGroupVisibility(group, groupIndex)}
                    disabled={!group.taskCount || group.hiding}
                    title={group.taskCount > 0 ? group.expanded ? locale.global.collapse : locale.global.expand : ""}>
                    <span className="tasks-group-count">{group.taskCount}</span>
                    <span className="tasks-group-title">{group.name}</span>
                    {group.taskCount > 0 && (
                      <Icon id="chevron-down" className="tasks-group-icon" />
                    )}
                  </button>
                )}
                {group.expanded && (
                  <ul className={`tasks-group-items${group.state ? ` ${group.state}` : ""}`}>
                    {group.tasks.map((task) => (
                      !settings.showCompletedRepeatingTasks && task.hidden ? null : (
                        <Task task={task} groupId={group.id} locale={locale} settings={settings} color={group.color} removeTask={removeTask} removeSubtask={(subtaskId) => removeSubtask(group, task, subtaskId)} editTask={() => editTask(group.id, task.id)} key={task.id} />
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
        <CreateButton className="tasks-create-btn" onClick={showForm} shiftTarget=".task-edit-btn" trackScroll></CreateButton>
        {storageWarning ? <Toast message={storageWarning.message} position="bottom" locale={locale} dismiss={dismissStorageWarning} /> : null}
      </div>
      {removedItemCount > 0 && <Footer locale={locale} removedItemsCount={removedItemCount} undoRemovedTasks={undoRemovedTasks} />}
    </>
  );
}
