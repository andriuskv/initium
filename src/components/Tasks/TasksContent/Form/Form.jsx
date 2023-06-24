import { useState, useRef, lazy, Suspense } from "react";
import { getRandomString } from "utils";
import Icon from "components/Icon";
import "./form.css";

const LabelForm = lazy(() => import("./LabelForm"));

export default function Form({ form, groups, updateGroups, replaceLink, removeTask, hide }) {
  const [state, setState] = useState(() => {
    const defaultForm = {
      moreOptionsVisible: false,
      labels: getUniqueTaskLabels(form.groupIndex, form.taskIndex),
      task: {
        rawText: "",
        subtasks: [getNewSubtask(), getNewSubtask()]
      }
    };

    if (form.updating) {
      const subtasks = [...form.task.subtasks];
      let missingSubtaskCount = 2 - subtasks.length;

      while (missingSubtaskCount > 0) {
        subtasks.push(getNewSubtask());
        missingSubtaskCount -= 1;
      }
      defaultForm.task.rawText = form.task.rawText;
      defaultForm.task.subtasks = subtasks;

      if (form.task.expirationDate) {
        defaultForm.moreOptionsVisible = true;
        defaultForm.task.expirationDate = form.task.expirationDate;
        defaultForm.task.expirationDateTimeString = getDateTimeString(form.task.expirationDate);
      }

      if (form.task.repeat) {
        defaultForm.moreOptionsVisible = true;
        defaultForm.task.repeat = {
          gap: form.task.repeat.gap,
          unit: form.task.repeat.unit,
          limit: form.task.repeat.limit < 0 ? "" : form.task.repeat.limit
        };
      }

      return {
        ...defaultForm,
        updating: true,
        selectedGroupId: form.selectedGroupId
      };
    }
    return defaultForm;
  });
  const [labelFormVisible, setLabelFormVisible] = useState(false);
  const [message, setMessage] = useState("");
  const messageTimeoutId = useRef();

  function toggleMoreOptions() {
    setState({
      ...state,
      moreOptionsVisible: !state.moreOptionsVisible
    });
  }

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

  function addUniqueLabel({ name, color }) {
    const label = findLabel(state.labels, { name, color });

    if (label) {
      label.flagged = true;
      setState({ ...state });
    }
    else if (name && color) {
      state.labels.push({ name, color, flagged: true });
      setState({ ...state });
    }
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
    const dateTime = state.moreOptionsVisible ? elements.datetime.value : "";
    const repeatGap = state.moreOptionsVisible ? Number(elements.repeatGap.value) : -1;
    const { selectedGroupId = "unorganized" } = state;
    const { tasks } = groups.find(({ id }) => id === selectedGroupId);
    const task = {
      creationDate: Date.now(),
      rawText: text,
      id: getRandomString(4),
      text: replaceLink(text),
      subtasks: getFormSubtasks(elements.subtask),
      labels: getFlaggedFormLabels()
    };

    event.preventDefault();

    if (repeatGap >= 1) {
      const repeatUnit = elements.repeatUnit.value;
      const repeatLimit = Number(elements.repeatLimit.value);

      task.repeat = {
        status: 0,
        number: 0,
        gap: repeatGap,
        unit: repeatUnit,
        limit: repeatLimit >= 1 ? repeatLimit : -1,
        history: [{
          id: getRandomString(4),
          status: 0,
          elapsed: 0
        }]
      };
    }

    if (state.updating) {
      const { taskIndex } = form;

      if (dateTime) {
        const selectedDateTime = new Date(dateTime).getTime();

        if (selectedDateTime !== state.task.expirationDate) {
          task.expirationDate = selectedDateTime;

          if (task.expirationDate <= task.creationDate) {
            showMessage("Expiration date can't be in the past.");
            return;
          }
        }
      }
      else if (state.task.expirationDate) {
        delete tasks[taskIndex].expirationDate;
      }

      if (repeatGap <= 0 && state.task.repeat) {
        delete tasks[taskIndex].repeat;
      }

      if (form.groupId !== selectedGroupId) {
        const group = groups.find(({ id }) => id === form.groupId);

        group.tasks.splice(taskIndex, 1);
        tasks.unshift(task);
      }
      else {
        delete tasks[taskIndex].hidden;
        tasks[taskIndex] = { ...tasks[taskIndex], ...task };
      }
    }
    else {
      if (dateTime) {
        task.expirationDate = new Date(dateTime).getTime();

        if (task.expirationDate <= task.creationDate) {
          showMessage("Expiration date can't be in the past.");
          return;
        }
      }
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

  function showLabelForm() {
    setLabelFormVisible(true);
  }

  function hideLabelForm() {
    setLabelFormVisible(false);
  }

  function getDateTimeString(time) {
    const date = time ? new Date(time) : new Date();

    // Split date/time string to display date, hours, and minutes
    const items = date.toISOString().split(":");

    return `${items[0]}:${items[1]}`;
  }

  function showMessage(message) {
    setMessage(message);
    clearTimeout(messageTimeoutId.current);

    messageTimeoutId.current = setTimeout(() => {
      setMessage("");
    }, 4000);
  }

  function hideMessage() {
    clearTimeout(messageTimeoutId.current);
    setMessage("");
  }

  return (
    <>
      <div className="tasks-header">
        <button className="btn icon-btn" onClick={toggleMoreOptions} title="More options">
          <Icon id="show-more"/>
        </button>
      </div>
      <div className="tasks-item-container task-form-container task-transition-target">
        <form className="task-form" onSubmit={handleTaskFormSubmit} onKeyDown={handleFormKeydown}>
          <div className="task-form-body">
            {state.moreOptionsVisible ? (
              <div className="task-form-more-options">
                <div className="task-form-item-container">
                  <h4 className="task-form-item-title">Expiration Date</h4>
                  <input name="datetime" type="datetime-local" className="input task-form-datetime-input"
                    min={getDateTimeString()}
                    defaultValue={state.task.expirationDateTimeString}
                  />
                </div>
                <div className="task-form-item-container task-form-repeat-options-container">
                  <h4 className="task-form-item-title">Repeat</h4>
                  <div className="task-form-repeat-options">
                    <div>
                      <div className="multi-input-container task-form-repeat-gap-unit-container">
                        <input type="text" className="input multi-input-left task-form-repeat-input"
                          defaultValue={state.task.repeat?.gap} name="repeatGap" placeholder="1" autoComplete="off"/>
                        <select className="input select multi-input-right"
                          defaultValue={state.task.repeat?.unit} name="repeatUnit">
                          <option value="day">day(s)</option>
                          <option value="week">week(s)</option>
                          <option value="month">month(s)</option>
                        </select>
                      </div>
                    </div>
                    <label>
                      <span className="label-left">Limit</span>
                      <input type="text" className="input task-form-repeat-input"
                        defaultValue={state.task.repeat?.limit} name="repeatLimit" autoComplete="off"/>
                    </label>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="task-form-item-container">
              <h4 className="task-form-item-title">Labels</h4>
              <button type="button" className="btn icon-btn subtask-add-btn" onClick={showLabelForm} title="Create new label">
                <Icon id="plus"/>
              </button>
            </div>
            {state.labels.length > 0 && (
              <ul className="task-form-labels">
                {state.labels.map((label, i) => (
                  <li className="task-form-label" key={i}>
                    <button type="button" className={`btn icon-text-btn task-form-label-btn${label.flagged ? " flagged" : ""}`}
                      onClick={() => flagLabel(i)}
                      title={label.flagged ? "Deselect label" : "Select label"}>
                      <div className="task-label-color" style={{ backgroundColor: label.color }}></div>
                      <div className="task-label-title">{label.name}</div>
                      {label.flagged && <Icon id="check" className="task-form-label-btn-tick"/>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <label className="task-form-item-container">
              <span className="task-form-item-title">Group</span>
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
            <div className="task-form-item-container">
              <h4 className="task-form-item-title">Subtasks</h4>
              <button type="button" className="btn icon-btn subtask-add-btn" onClick={addFormSubtask} title="Add a subtask">
                <Icon id="plus"/>
              </button>
            </div>
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
          </div>
          <div className="tasks-item-container-footer">
            {state.updating ? <button type="button" className="btn text-btn text-negative-btn task-form-delete-btn" onClick={removeTask}>Delete</button> : null}
            <button type="button" className="btn text-btn" onClick={hide}>Cancel</button>
            <button type="submit" className="btn task-form-submit-btn">{state.updating ? "Update" : "Create"}</button>
          </div>
        </form>
        {message ? (
          <div className="container task-form-message-container">
            <p className="task-form-message">{message}</p>
            <button className="btn icon-btn" onClick={hideMessage}>
              <Icon id="cross"/>
            </button>
          </div>
        ) : null}
        {labelFormVisible && (
          <Suspense fallback={null}>
            <LabelForm addUniqueLabel={addUniqueLabel} hide={hideLabelForm}/>
          </Suspense>
        )}
      </div>
    </>
  );
}