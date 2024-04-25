import { useState, lazy, Suspense } from "react";
import { getRandomString, replaceLink } from "utils";
import { useModal, useMessage } from "hooks";
import { getSetting } from "services/settings";
import { formatDate, padTime } from "services/timeDate";
import { SortableItem, SortableList } from "components/Sortable";
import Icon from "components/Icon";
import "./form.css";
import Subtask from "./Subtask";

const Toast = lazy(() => import("components/Toast"));
const GroupForm = lazy(() => import("../GroupForm"));
const LabelForm = lazy(() => import("./LabelForm"));

export default function Form({ form, groups, locale, updateGroups, removeTask, createGroup, hide }) {
  const [state, setState] = useState(() => {
    const defaultForm = {
      moreOptionsVisible: false,
      completeWithSubtasks: !!form.completeWithSubtasks,
      labels: getUniqueTaskLabels(form.groupIndex, form.taskIndex),
      task: {
        rawText: "",
        subtasks: [getDefaultTask(), getDefaultTask()]
      }
    };

    if (form.updating) {
      const subtasks = [...form.task.subtasks];
      let missingSubtaskCount = 2 - subtasks.length;

      while (missingSubtaskCount > 0) {
        subtasks.push(getDefaultTask());
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
  const [modal, setModal, hideModal] = useModal(null);
  const [activeDragId, setActiveDragId] = useState(null);
  const [prefsVisible, setPrefsVisible] = useState(state.completeWithSubtasks);
  const [message, showMessage, dismissMessage] = useMessage("");

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

  function getDefaultTask(text = "", props = {}) {
    const { openLinkInNewTab } = getSetting("general");

    return {
      id: getRandomString(4),
      rawText: text,
      text: replaceLink(text, "task-link", openLinkInNewTab),
      ...props
    };
  }

  function addFormSubtask() {
    setState({ ...state, task: { ...state.task, subtasks: [...state.task.subtasks, getDefaultTask()] } });
  }

  function removeFormSubtask(index) {
    const subtasks = state.task.subtasks.toSpliced(index, 1);

    setState({ ...state, task: { ...state.task, subtasks} });
  }

  function handleTaskFormSubmit(event) {
    event.preventDefault();

    const { elements } = event.target;
    const text = elements.text.value.trim();
    const dateTime = state.moreOptionsVisible ? elements.datetime.value : "";
    const repeatGap = state.moreOptionsVisible ? Number(elements.repeatGap.value) : -1;
    const { selectedGroupId = "default" } = state;
    const { tasks } = groups.find(({ id }) => id === selectedGroupId);
    const task = getDefaultTask(text, {
      creationDate: Date.now(),
      subtasks: getFormSubtasks(elements.subtask),
      labels: getFlaggedFormLabels()
    });

    if (state.completeWithSubtasks) {
      task.completeWithSubtasks = true;
    }

    if (repeatGap >= 1) {
      const repeatUnit = elements.repeatUnit.value;
      const repeatLimit = Number(elements.repeatLimit.value);

      task.repeat = {
        start: Date.now(),
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
          const { dateLocale } = getSetting("timeDate");
          task.expirationDateString = formatDate(task.expirationDate, {
            locale: dateLocale,
            includeTime: true
          });
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
        const { dateLocale } = getSetting("timeDate");
        task.expirationDateString = formatDate(task.expirationDate, {
          locale: dateLocale,
          includeTime: true
        });
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

      return [getDefaultTask(text, {
        optional: state.task.subtasks[0].optional
      })];
    }
    else if (elements.length) {
      const subtasks = [];

      for (let i = 0; i < elements.length; i += 1) {
        const text = elements[i].value.trim();

        if (text) {
          subtasks.push(getDefaultTask(text, {
            optional: state.task.subtasks[i].optional
          }));
        }
      }
      return subtasks;
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
    setModal({ type: "label" });
  }

  function showGroupForm() {
    setModal({ type: "group" });
  }

  function getDateTimeString(time) {
    const date = time ? new Date(time) : new Date();
    const years = date.getFullYear();
    const months = date.getMonth() + 1;
    const days = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    return `${years}-${padTime(months)}-${padTime(days)}T${padTime(hours)}:${padTime(minutes)}`;
  }

  function togglePrefsVisibility() {
    setPrefsVisible(!prefsVisible);
  }

  function togglePref({ target }) {
    if (!target.checked) {
      for (const subtask of state.task.subtasks) {
        delete subtask.optional;
      }
    }
    setState({ ...state, completeWithSubtasks: target.checked });
  }

  function toggleSubtaskReq(index) {
    state.task.subtasks[index].optional = !state.task.subtasks[index].optional;
    setState({ ...state });
  }

  function handleSort(items) {
    if (items) {
      setState({...state, task: { ...state.task, subtasks: items } });
    }
    setActiveDragId(null);
  }

  function handleDragStart(event) {
    setActiveDragId(event.active.id);
  }

  function renderSubtasks(subtask, index) {
    const component = {
      Component: Subtask,
      params: {
        index,
        subtask,
        locale,
        completeWithSubtasks: state.completeWithSubtasks,
        toggleSubtaskReq,
        removeFormSubtask
      }
    };

    return (
      <SortableItem className={`task-form-subtask${subtask.id === activeDragId ? " dragging" : ""}`}
        component={component} id={subtask.id} key={subtask.id} handleTitle={locale.global.drag}/>
    );
  }

  function renderModal() {
    if (!modal) {
      return;
    }

    if (modal.type === "label") {
      return (
        <Suspense fallback={null}>
          <LabelForm locale={locale} addUniqueLabel={addUniqueLabel} hiding={modal.hiding} hide={hideModal}/>
        </Suspense>
      );
    }
    else if (modal.type === "group") {
      return (
        <Suspense fallback={null}>
          <GroupForm locale={locale} createGroup={localCreateGroup} hiding={modal.hiding} hide={hideModal} modal/>
        </Suspense>
      );
    }
  }

  return (
    <>
      <div className="container-header">
        <button className="btn icon-btn" onClick={toggleMoreOptions} title={locale.tasks.more_options_title}>
          <Icon id="show-more"/>
        </button>
      </div>
      <form className="task-form" onSubmit={handleTaskFormSubmit} onKeyDown={handleFormKeydown}>
        <div className="container-body task-form-body" data-dropdown-parent>
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
          <div className="textarea-container task-form-textarea-container">
            <textarea className="input textarea task-form-textarea" name="text" defaultValue={state.task.rawText}
              placeholder="Details" autoFocus required></textarea>
          </div>
          <div className="task-form-item-container">
            <h4 className="task-form-item-title">{locale.tasks.subtask_title}</h4>
            <button type="button" className={`btn icon-btn task-form-pref-toggle-btn${prefsVisible ? " expanded" : ""}`}
              onClick={togglePrefsVisibility} title={prefsVisible ? locale.global.collapse : locale.global.expand}>
              <Icon id="chevron-down"/>
            </button>
            <button type="button" className="btn icon-btn" onClick={addFormSubtask} title={locale.tasks.add_subtask_title}>
              <Icon id="plus"/>
            </button>
          </div>
          {prefsVisible ? (
            <div className="task-form-preferences">
              <label className="task-form-pref">
                <input type="checkbox" className="sr-only checkbox-input" name="completeWithSubtasks"
                  checked={state.completeWithSubtasks} onChange={togglePref}/>
                <div className="checkbox">
                  <div className="checkbox-tick"></div>
                </div>
                <span>Complete the task by completing all its subtasks</span>
              </label>
            </div>
          ) : null}
          {state.task.subtasks.length > 0 && (
            <ul className={`task-form-subtasks${activeDragId ? " dragging" : ""}`}>
              <SortableList
                items={state.task.subtasks}
                handleSort={handleSort}
                handleDragStart={handleDragStart}>
                {state.task.subtasks.map((subtask, index) => renderSubtasks(subtask, index))}
              </SortableList>
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
      {renderModal()}
    </>
  );
}
