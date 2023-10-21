import { useState, useRef, lazy, Suspense } from "react";
import { getRandomString, timeout } from "utils";
import Icon from "components/Icon";
import "./form.css";

const Toast = lazy(() => import("components/Toast"));
const GroupForm = lazy(() => import("../GroupForm"));
const LabelForm = lazy(() => import("./LabelForm"));

export default function Form({ form, groups, locale, updateGroups, replaceLink, removeTask, createGroup, hide }) {
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
        subtasks.unshift(getNewSubtask());
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
  const [groupFormVisible, setGroupFormVisible] = useState(false);
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

  function localCreateGroup(group) {
    setState({ ...state, selectedGroupId: group.id });
    createGroup(group);
  }

  function getNewSubtask() {
    return {
      id: getRandomString(4),
      rawText: ""
    };
  }

  function addFormSubtask() {
    state.task.subtasks.unshift(getNewSubtask());
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
    const { selectedGroupId = "default" } = state;
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

  function showGroupForm() {
    setGroupFormVisible(true);
  }

  function hideGroupForm() {
    setGroupFormVisible(false);
  }

  function getDateTimeString(time) {
    const date = time ? new Date(time) : new Date();

    // Split date/time string to display date, hours, and minutes
    const items = date.toISOString().split(":");

    return `${items[0]}:${items[1]}`;
  }

  function showMessage(message) {
    setMessage(message);

    messageTimeoutId.current = timeout(() => {
      setMessage("");
    }, 4000, messageTimeoutId.current);
  }

  function dismissMessage() {
    clearTimeout(messageTimeoutId.current);
    setMessage("");
  }

  return (
    <>
      <div className="container-header">
        <button className="btn icon-btn" onClick={toggleMoreOptions} title={locale.tasks.more_options_title}>
          <Icon id="show-more"/>
        </button>
      </div>
      <form className="task-form" onSubmit={handleTaskFormSubmit} onKeyDown={handleFormKeydown}>
        <div className="container-body task-form-body">
          {state.moreOptionsVisible ? (
            <div className="task-form-more-options">
              <div className="task-form-item-container">
                <h4 className="task-form-item-title">{locale.tasks.expiration_date_label}</h4>
                <input name="datetime" type="datetime-local" className="input task-form-datetime-input"
                  min={getDateTimeString()}
                  defaultValue={state.task.expirationDateTimeString}
                />
              </div>
              <div className="task-form-item-container task-form-repeat-options-container">
                <h4 className="task-form-item-title">{locale.tasks.repeat_label}</h4>
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
                    <span className="label-left">{locale.tasks.limit_label}</span>
                    <input type="text" className="input task-form-repeat-input"
                      defaultValue={state.task.repeat?.limit} name="repeatLimit" autoComplete="off"/>
                  </label>
                </div>
              </div>
            </div>
          ) : null}
          <div className="task-form-item-container">
            <h4 className="task-form-item-title">{locale.tasks.label_title}</h4>
            <button type="button" className="btn icon-btn" onClick={showLabelForm} title={locale.tasks.create_label_title}>
              <Icon id="plus"/>
            </button>
          </div>
          {state.labels.length > 0 && (
            <ul className="task-form-labels">
              {state.labels.map((label, i) => (
                <li className="task-form-label" key={i}>
                  <button type="button" className={`btn icon-text-btn task-form-label-btn${label.flagged ? " flagged" : ""}`}
                    onClick={() => flagLabel(i)}
                    title={label.flagged ? locale.global.deselect : locale.global.select}>
                    <div className="task-label-color" style={{ backgroundColor: label.color }}></div>
                    <div className="task-label-title">{label.name}</div>
                    {label.flagged && <Icon id="check" className="task-form-label-btn-tick"/>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="task-form-item-container">
            <h4 className="task-form-item-title">{locale.tasks.group_title}</h4>
            <div className="select-container">
              <select className="input select" onChange={handleGroupSelection} value={state.selectedGroupId}>
                {groups.map(group => (
                  <option value={group.id} key={group.id}>{group.id === "default" ? "" : group.name}</option>
                ))}
              </select>
            </div>
            <button type="button" className="btn icon-btn" onClick={showGroupForm} title={locale.tasks.create_group_title}>
              <Icon id="plus"/>
            </button>
          </div>
          <div className="task-form-textarea-container">
            <textarea className="input task-form-textarea" name="text" defaultValue={state.task.rawText}
              placeholder="Details" autoFocus required></textarea>
          </div>
          <div className="task-form-item-container">
            <h4 className="task-form-item-title">{locale.tasks.subtask_title}</h4>
            <button type="button" className="btn icon-btn" onClick={addFormSubtask} title={locale.tasks.add_subtask_title}>
              <Icon id="plus"/>
            </button>
          </div>
          {state.task.subtasks.length > 0 && (
            <ul className="task-form-subtasks">
              {state.task.subtasks.map((subtask, i) => (
                <li className="task-form-subtask" key={subtask.id}>
                  <input type="text" name="subtask" className="input task-form-subtask-input"
                    defaultValue={subtask.rawText} autoComplete="off"/>
                  <button type="button" className="btn icon-btn alt-icon-btn" onClick={() => removeFormSubtask(i)} title={locale.global.remove}>
                    <Icon id="trash"/>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="container-footer">
          {state.updating ? <button type="button" className="btn text-btn text-negative-btn task-form-delete-btn" onClick={removeTask}>{locale.global.delete}</button> : null}
          <button type="button" className="btn text-btn" onClick={hide}>{locale.global.cancel}</button>
          <button type="submit" className="btn task-form-submit-btn">{state.updating ? locale.global.update : locale.global.create}</button>
        </div>
      </form>
      {message ? (
        <Suspense fallback={null}>
          <Toast message={message} position="bottom" offset="40px" locale={locale} dismiss={dismissMessage}/>
        </Suspense>
      ) : null}
      {labelFormVisible && (
        <Suspense fallback={null}>
          <LabelForm locale={locale} addUniqueLabel={addUniqueLabel} hide={hideLabelForm}/>
        </Suspense>
      )}
      {groupFormVisible && (
        <Suspense fallback={null}>
          <GroupForm locale={locale} createGroup={localCreateGroup} hide={hideGroupForm} modal/>
        </Suspense>
      )}
    </>
  );
}
