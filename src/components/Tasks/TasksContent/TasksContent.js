import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { getRandomString } from "utils";
import * as chromeStorage from "services/chromeStorage";
import { getSetting, updateSetting } from "services/settings";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import "./tasks-content.css";

const Form = lazy(() => import("./Form"));
const Groups = lazy(() => import("./Groups"));
const Settings = lazy(() => import("./Settings"));

export default function Tasks() {
  const [settings, setSettings] = useState(() => ({
    defaultGroupVisible: false,
    emptyGroupsHidden: false,
    ...getSetting("tasks")
  }));
  const [groups, setGroups] = useState(null);
  const [removedItems, setRemovedItems] = useState([]);
  const [form, setForm] = useState(null);
  const [activeComponent, setActiveComponent] = useState(null);
  const [taskCount, setTaskCount] = useState(null);
  const taskRemoveTimeoutId = useRef(0);

  useEffect(() => {
    init();
  }, []);

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

    initGroups(groups);

    chromeStorage.subscribeToChanges(({ tasks }) => {
      if (!tasks) {
        return;
      }

      if (tasks.newValue) {
        initGroups(tasks.newValue);
      }
      else {
        setGroups([getDefaultGroup()]);
        setTaskCount(null);
      }
    });
  }

  function initGroups(groups) {
    setGroups(groups.map(group => {
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
        return task;
      });
      return group;
    }));
    countTasks(groups);
  }

  function getDefaultGroup() {
    return {
      id: "unorganized",
      name: "Unorganized",
      expanded: true,
      tasks: []
    };
  }

  function parseTask(task) {
    task.id = getRandomString();
    task.rawText ??= task.text;
    task.text = replaceLink(task.rawText);
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

  function removeCompletedItems() {
    for (const group of groups) {
      group.tasks = group.tasks.filter(task => {
        task.subtasks = task.subtasks.filter(subtask => !subtask.removed);
        return !task.removed;
      });
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
    const { rawText, subtasks } = group.tasks[taskIndex];

    setActiveComponent("form");
    setForm({
      updating: true,
      groupIndex,
      taskIndex,
      groupId: group.id,
      selectedGroupId: group.id,
      task: {
        rawText,
        subtasks
      }
    });
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

  function hideActiveComponent() {
    setActiveComponent(null);
  }

  function cleanupTask(task) {
    delete task.id;
    delete task.text;
    delete task.removed;
    return task;
  }

  async function saveTasks(groups) {
    chromeStorage.set({ tasks: structuredClone(groups).map(group => {
      group.tasks = group.tasks.map(task => {
        task = cleanupTask(task);
        task.subtasks = task.subtasks.map(cleanupTask);
        return task;
      });
      return group;
    })});
  }

  function updateGroups(groups, shouldSave = true) {
    setGroups([...groups]);
    countTasks(groups);

    if (shouldSave) {
      saveTasks(groups);
    }
  }

  function countTasks(groups) {
    let count = 0;

    for (const group of groups) {
      count += group.tasks.length;
    }
    setTaskCount(count);
  }

  function showSettings() {
    setActiveComponent("settings");
  }

  function toggleSetting(event) {
    if (event.target.name === "defaultGroupVisible" && !groups[0].expanded) {
      groups[0].expanded = true;
      setGroups([...groups]);
      saveTasks(groups);
    }
    setSettings({
      ...settings,
      [event.target.name]: event.target.checked
    });

    updateSetting({
      tasks: {
        emptyGroupsHidden: event.target.checked
      }
    });
  }

  function updateComponentHeight(height) {
    updateSetting({ tasks: { height } });
  }

  if (!groups) {
    return null;
  }

  if (activeComponent === "form") {
    return (
      <Suspense fallback={null}>
        <Form form={form} groups={groups} updateGroups={updateGroups} replaceLink={replaceLink} hide={hideActiveComponent}/>
      </Suspense>
    );
  }
  else if (activeComponent === "groups") {
    return (
      <Suspense fallback={null}>
        <Groups groups={groups} updateGroups={updateGroups} hide={hideForm}/>
      </Suspense>
    );
  }
  else if (activeComponent === "settings") {
    return (
      <Suspense fallback={null}>
        <Settings settings={settings} toggleSetting={toggleSetting} saveHeight={updateComponentHeight} hide={hideActiveComponent}/>
      </Suspense>
    );
  }
  return (
    <>
      <div className="tasks-header">
        <Dropdown>
          <button className="btn icon-text-btn dropdown-btn" onClick={showGroups}>
            <Icon id="menu"/>
            <span>Groups</span>
          </button>
          <button className="btn icon-text-btn dropdown-btn" onClick={showSettings}>
            <Icon id="settings"/>
            <span>Settings</span>
          </button>
        </Dropdown>
      </div>
      <div className={`tasks-main${removedItems.length > 0 ? " dialog-visible" : ""}`}>
        {taskCount > 0 ? (
          <ul className="tasks-groups-container">
            {groups.map((group, groupIndex) => (group.tasks.length === 0 && settings.emptyGroupsHidden ? null : (
              <li key={group.id}>
                {(groupIndex > 0 || settings.defaultGroupVisible) && (
                  <button className="btn icon-btn tasks-groups-item tasks-groups-item-toggle-btn"
                    onClick={() => toggleGroupVisibility(group)}
                    disabled={!group.tasks.length}
                    title={group.tasks.length > 0 ? group.expanded ? "Collapse group" : "Expand group" : ""}>
                    <span className="tasks-group-count">{group.tasks.length}</span>
                    <span className="tasks-group-title">{group.name}</span>
                    {group.tasks.length > 0 && (
                      <Icon id={`chevron-${group.expanded ? "up" : "down"}`} className="tasks-group-icon"/>
                    )}
                  </button>
                )}
                {group.expanded && (
                  <ul>
                    {group.tasks.map((task, taskIndex) => (
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
                            <button className="checkbox task-checkbox-btn"
                              onClick={() => removeTask(groupIndex, taskIndex)} title="Remove">
                              <div className="checkbox-tick"></div>
                            </button>
                            <div className="task-text" dangerouslySetInnerHTML={{ __html: task.text }}></div>
                          </div>
                          {task.subtasks.length > 0 && (
                            <ul className="subtasks">
                              {task.subtasks.map((subtask, subtaskIndex) => (
                                <li className={`subtask${subtask.removed ? " removed" : ""}`} key={subtask.id}>
                                  <div className="subtask-body">
                                    <button className="checkbox task-checkbox-btn"
                                      onClick={() => removeSubtask(groupIndex, taskIndex, subtaskIndex)}title="Remove">
                                      <div className="checkbox-tick"></div>
                                    </button>
                                    <span className="task-text" dangerouslySetInnerHTML={{ __html: subtask.text }}></span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                          <button className="btn icon-btn alt-icon-btn task-edit-btn"
                            onClick={() => editTask(groupIndex, taskIndex)} title="Edit">
                            <Icon id="edit"/>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )))}
          </ul>
        ) : (
          <p className="tasks-message">No tasks</p>
        )}
        {removedItems.length > 0 && (
          <div className="tasks-dialog">
            <span>Removed <span className="tasks-dialog-count">{removedItems.length}</span> task{removedItems.length > 1 ? "s" : ""}</span>
            <button className="btn text-btn tasks-dialog-btn" onClick={undoRemovedTasks}>UNDO</button>
          </div>
        )}
        <button className="btn icon-text-btn tasks-create-btn" onClick={showForm}>
          <Icon id="plus"/>
          <span className="tasks-create-btn-title">Create</span>
        </button>
      </div>
    </>
  );
}
