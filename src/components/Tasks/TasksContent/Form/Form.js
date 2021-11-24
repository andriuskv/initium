import { useState, useRef } from "react";
import { getRandomString, getRandomHexColor } from "utils";
import Icon from "components/Icon";
import "./form.css";

export default function Form({ form, groups, updateGroups, replaceLink, hide }) {
  const [state, setState] = useState(() => {
    const defaultForm = {
      color: getRandomHexColor(),
      labels: getUniqueTaskLabels(form.groupIndex, form.taskIndex),
      task: {
        rawText: "",
        subtasks: [getNewSubtask(), getNewSubtask()]
      }
    };

    if (form.updating) {
      const subtasks = [...form.task.subtasks];
      let misingSubtaskCount = 2 - subtasks.length;

      while (misingSubtaskCount > 0) {
        subtasks.push(getNewSubtask());
        misingSubtaskCount -= 1;
      }
      defaultForm.task.rawText = form.task.rawText;
      defaultForm.task.subtasks = subtasks;
      delete form.task;

      return {
        ...defaultForm,
        ...form
      };
    }
    return defaultForm;
  });
  const updatingColor = useRef(false);

  function getUniqueTaskLabels(groupIndex = -1, taskIndex = -1) {
    let labels = [];

    for (const group of groups) {
      for (const task of group.tasks) {
        for (const label of task.labels) {
          if (!findLabel(labels, label)) {
            labels.push({ ...label });
          }
        }
      }
    }

    if (groupIndex > -1) {
      const taskLabels = groups[groupIndex].tasks[taskIndex].labels;

      labels = labels.map(label => {
        if (findLabel(taskLabels, label)) {
          label.flagged = true;
        }
        return label;
      });
    }
    return labels;
  }

  function findLabel(labels, { name, color }) {
    return labels.find(label => label.name === name && label.color === color);
  }

  function handleColorChange({ target }) {
    if (updatingColor.current) {
      return;
    }
    updatingColor.current = true;

    requestAnimationFrame(() => {
      setState({
        ...state,
        color: target.value
      });
      updatingColor.current = false;
    });
  }

  function handleLabelFormSubmit(event) {
    const { elements } = event.target;
    const name = elements.name.value.trim();
    const color = elements.color.value;
    const label = findLabel(state.labels, { name, color });

    event.preventDefault();

    if (!label && name && color) {
      state.labels.push({ name, color, flagged: true });
    }
    const nextColor = getRandomHexColor();
    elements.name.value = "";
    elements.color.value = nextColor;
    state.color = nextColor;

    setState({ ...state });
  }

  function flagLabel(index) {
    const label = state.labels[index];
    label.flagged = !label.flagged;
    setState({ ...state });
  }

  function handleGroupSelection({ target }) {
    state.selectedGroupId = target.value;
    setState({ ...state });
  }

  function getNewSubtask() {
    return {
      id: getRandomString(4),
      rawText: ""
    };
  }

  function addFormSubtask() {
    state.task.subtasks.push(getNewSubtask());
    setState({ ...state });
  }

  function removeFormSubtask(index) {
    state.task.subtasks.splice(index, 1);
    setState({ ...state });
  }

  function handleTaskFormSubmit(event) {
    const { elements } = event.target;
    const text = elements.text.value.trim();
    const { groupId, selectedGroupId = "unorganized" } = state;
    const { tasks } = groups.find(({ id }) => id === selectedGroupId);
    const task = {
      rawText: text,
      id: getRandomString(4),
      text: replaceLink(text),
      subtasks: getFormSubtasks(elements.subtask),
      labels: getFlaggedFormLabels()
    };

    event.preventDefault();

    if (state.updating) {
      const { taskIndex } = state;

      if (groupId !== selectedGroupId) {
        const group = groups.find(({ id }) => id === groupId);

        group.tasks.splice(taskIndex, 1);
        tasks.unshift(task);
      }
      else {
        tasks[taskIndex] = { ...tasks[taskIndex], ...task };
      }
    }
    else {
      tasks.unshift(task);
    }
    updateGroups(groups);
    hide();
  }

  function handleFormKeydown(event) {
    if (event.key === "Enter" && event.target.nodeName === "INPUT") {
      event.preventDefault();
    }
  }

  function getFormSubtasks(elements) {
    if (!elements) {
      return [];
    }
    else if (elements.value) {
      const text = elements.value.trim();

      return [{
        id: getRandomString(4),
        rawText: text,
        text: replaceLink(text)
      }];
    }
    else if (elements.length) {
      return Array.from(elements).reduce((tasks, { value }) => {
        const text = value.trim();

        if (text) {
          tasks.push({
            id: getRandomString(4),
            rawText: text,
            text: replaceLink(text)
          });
        }
        return tasks;
      }, []);
    }
    return [];
  }

  function getFlaggedFormLabels() {
    return state.labels.reduce((labels, label) => {
      if (label.flagged) {
        delete label.flagged;
        labels.push(label);
      }
      return labels;
    }, []);
  }

  return (
    <div className="tasks-item-container task-form-container task-transition-target">
      <form onSubmit={handleLabelFormSubmit} className="task-label-form">
        <div className="task-form-color-picker-container" style={{ backgroundColor: state.color }}>
          <input type="color" name="color" className="task-form-color-picker"
            onInput={handleColorChange} defaultValue={state.color} title="Change color"/>
        </div>
        <div className="input-btn-container">
          <input type="text" name="name" className="input" placeholder="Label" autoComplete="off" required/>
          <button className="btn text-btn">Create</button>
        </div>
      </form>
      {state.labels.length > 0 && (
        <ul className="task-form-labels">
          {state.labels.map((label, i) => (
            <li className="task-form-label" key={i}>
              <button type="button" className={`btn icon-text-btn task-form-label-btn${label.flagged ? " flagged" : ""}`}
                onClick={() => flagLabel(i)}
                title={label.flagged ? "Deselect label" : "Select label"}>
                <div className="task-label-color" style={{ backgroundColor: label.color }}></div>
                <div className="task-label-title">{label.name}</div>
                <div className="checkbox-tick task-form-label-btn-tick"></div>
              </button>
            </li>
          ))}
        </ul>
      )}
      <form className="task-form" onSubmit={handleTaskFormSubmit} onKeyDown={handleFormKeydown}>
        <label className="task-form-group-select-container">
          <span className="task-form-group-select-input-name">Group</span>
          <div className="select-container">
            <select className="input select" onChange={handleGroupSelection} value={state.selectedGroupId}>
              {groups.map(group => (
                <option value={group.id} key={group.id}>{group.id === "unorganized" ? "" : group.name}</option>
              ))}
            </select>
          </div>
        </label>
        <div className="task-form-textarea-container">
          <textarea className="input task-form-textarea" name="text" defaultValue={state.task.rawText}
            placeholder="Details" required></textarea>
        </div>
        <button type="button" className="btn icon-text-btn subtask-add-btn" onClick={addFormSubtask}>
          <Icon id="plus"/>
          <span>Add a subtask</span>
        </button>
        {state.task.subtasks.length > 0 && (
          <ul className="task-form-subtasks">
            {state.task.subtasks.map((subtask, i) => (
              <li className="task-form-subtask" key={subtask.id}>
                <input type="text" name="subtask" className="input task-form-subtask-input"
                  defaultValue={subtask.rawText} autoComplete="off"/>
                <button type="button" className="btn icon-btn alt-icon-btn" onClick={() => removeFormSubtask(i)} title="Remove">
                  <Icon id="trash"/>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="tasks-item-container-footer">
          <button type="button" className="btn text-btn" onClick={hide}>Cancel</button>
          <button type="submit" className="btn">{state.makingEdit ? "Update" : "Create"}</button>
        </div>
      </form>
    </div>
  );
}
