import { useState, lazy, Suspense, type FormEvent, type ChangeEvent, type KeyboardEvent } from "react";
import type { DragStartEvent } from "@dnd-kit/core";
import { getLocalStorageItem, getRandomString, replaceLink } from "utils";
import { useModal, useMessage } from "hooks";
import { getSetting } from "services/settings";
import { formatDate, getDateString } from "services/timeDate";
import { SortableItem, SortableList } from "components/Sortable";
import Icon from "components/Icon";
import "./form.css";
import GroupForm from "../GroupForm";
import LabelForm from "./LabelForm";
import Subtask from "./Subtask";
import type { Label, Subtask as SubtaskType, TaskType, Group, TaskForm } from "components/Tasks/tasks.type";
import type { GeneralSettings, TimeDateSettings } from "types/settings";

const Toast = lazy(() => import("components/Toast"));

type State = {
  creationDate?: number,
  updating?: boolean,
  groupIndex?: number,
  taskIndex?: number,
  groupId?: string,
  selectedGroupId?: string,
  moreOptionsVisible: boolean,
  completeWithSubtasks?: boolean,
  labels: Label[],
  task: Omit<TaskType, "labels">
}

type Props = {
  form: TaskForm,
  groups: Group[],
  replaceGroups: (items: { index: number, group: Group }[], shouldSave?: boolean) => void,
  removeTask: () => void,
  createGroup: (group: Group) => void,
  hide: () => void,
  locale: any
}

export default function Form({ form, groups, locale, replaceGroups, removeTask, createGroup, hide }: Props) {
  const [state, setState] = useState<State>(() => {
    const defaultForm: State = {
      moreOptionsVisible: false,
      completeWithSubtasks: false,
      labels: form ? getUniqueTaskLabels(form.groupIndex, form.taskIndex): [],
      task: {
        creationDate: Date.now(),
        id: getRandomString(4),
        rawText: "",
        subtasks: [getDefaultTask(), getDefaultTask()]
      }
    };

    if (form?.updating) {
      const task = groups[form.groupIndex!].tasks[form.taskIndex!];
      const subtasks = [...task.subtasks];
      let missingSubtaskCount = 2 - subtasks.length;

      while (missingSubtaskCount > 0) {
        subtasks.push(getDefaultTask());
        missingSubtaskCount -= 1;
      }
      defaultForm.task.rawText = task.rawText;
      defaultForm.task.subtasks = subtasks;

      if (task.expirationDate) {
        defaultForm.moreOptionsVisible = true;
        defaultForm.task.expirationDate = task.expirationDate;
        defaultForm.task.expirationDateString = getDateTimeString(task.expirationDate);
      }

      if (task.repeat) {
        defaultForm.moreOptionsVisible = true;
        defaultForm.task.repeat = {
          number: task.repeat.number,
          start: task.repeat.start,
          gap: task.repeat.gap,
          unit: task.repeat.unit,
          limit: typeof task.repeat.limit === "number" && task.repeat.limit < 0 ? 0 : task.repeat.limit
        };
      }

      return {
        ...defaultForm,
        updating: true,
        completeWithSubtasks: !!task.completeWithSubtasks,
        selectedGroupId: form.groupId
      };
    }
    return defaultForm;
  });
  const { modal, setModal, hiding: modalHiding, hideModal } = useModal();
  const [activeDragId, setActiveDragId] = useState("");
  const [prefsVisible, setPrefsVisible] = useState(state.completeWithSubtasks);
  const { message, showMessage, dismissMessage }= useMessage("");

  function toggleMoreOptions() {
    setState({
      ...state,
      moreOptionsVisible: !state.moreOptionsVisible
    });
  }

  function getUniqueTaskLabels(groupIndex = -1, taskIndex = -1) {
    let labels: Label[] = (getLocalStorageItem<Label[]>("taskLabels") || []).map((label: Label) => {
      label.id = getRandomString();
      return label;
    });

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

  function findLabelInTasks(label: Label) {
    for (const group of groups) {
      for (const task of group.tasks) {
        if (findLabel(task.labels, label)) {
          return true;
        }
      }
    }
  }

  function findLabel(labels: Label[], { name, color }: Label) {
    return labels.find(label => label.name === name && label.color === color);
  }

  function findLabelIndex(labels: Label[], { name, color }: Label) {
    return labels.findIndex(label => label.name === name && label.color === color);
  }

  function addUniqueLabel(newLabel: Label): boolean {
    const index = findLabelIndex(state.labels, newLabel);

    if (index !== -1) {
      setState({
        ...state,
        labels: state.labels.with(index, {
          ...state.labels[index],
          flagged: true
        })
      });
      return false;
    }
    setState({
      ...state,
      labels: [...state.labels, newLabel]
    });
    return true;
  }

  function removeTaskLabel(label: Label) {
    if (findLabelInTasks(label)) {
      return;
    }
    const index = findLabelIndex(state.labels, label);

    if (index !== -1) {
      setState({
        ...state,
        labels: state.labels.toSpliced(index, 1)
      });
      return true;
    }
  }

  function flagLabel(index: number) {
    const label = state.labels[index];

    setState({
      ...state,
      labels: state.labels.with(index, {
        ...label,
        flagged: !label.flagged
      })
    });
  }

  function handleGroupSelection({ target }: ChangeEvent) {
    setState({
      ...state,
      selectedGroupId: (target as HTMLSelectElement).value
    });
  }

  function localCreateGroup(group: Group) {
    setState({ ...state, selectedGroupId: group.id });
    createGroup(group);
  }

  function getDefaultTask(text = "", props = {}): TaskType | SubtaskType {
    const { openLinkInNewTab } = getSetting("general") as GeneralSettings;

    return {
      id: getRandomString(4),
      rawText: text,
      text: replaceLink(text, "task-link", openLinkInNewTab),
      ...props
    };
  }

  function addFormSubtask() {
    const subtask: SubtaskType = getDefaultTask();

    setState({
      ...state,
      task: {
        ...state.task,
        subtasks: [...state.task.subtasks, subtask]
      }
    });
  }

  function removeFormSubtask(index: number) {
    const subtasks = state.task.subtasks.toSpliced(index, 1);

    setState({ ...state, task: { ...state.task, subtasks} });
  }

  function handleTaskFormSubmit(event: FormEvent) {
    interface FormElements extends HTMLFormControlsCollection {
      text: HTMLInputElement;
      datetime: HTMLInputElement;
      repeatUnit: HTMLInputElement;
      repeatGap: HTMLInputElement;
      repeatLimit: HTMLInputElement;
      subtask: HTMLInputElement;
    }

    event.preventDefault();

    const formElement = event.target as HTMLFormElement;
    const elements = formElement.elements as FormElements;
    const text = elements.text.value.trim();
    const dateTime = state.moreOptionsVisible ? elements.datetime.value : "";
    const repeatGap = state.moreOptionsVisible ? Number(elements.repeatGap.value) : -1;
    const { selectedGroupId = "default" } = state;
    const index = groups.findIndex(({ id }) => id === selectedGroupId);
    const tasks = groups[index].tasks;
    const task = getDefaultTask(text, {
      creationDate: Date.now(),
      subtasks: getFormSubtasks(elements.subtask),
      labels: getFlaggedFormLabels()
    }) as TaskType;

    if (!text) {
      return;
    }

    if (state.completeWithSubtasks) {
      task.completeWithSubtasks = true;
    }

    if (repeatGap >= 1) {
      const repeatUnit = elements.repeatUnit.value as "day" | "week" | "month";
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
      const taskIndex = form.taskIndex as number;
      const taskProps: Partial<TaskType> = {};

      if (dateTime) {
        const selectedDateTime = new Date(dateTime).getTime();

        if (selectedDateTime !== state.task.expirationDate) {
          task.expirationDate = selectedDateTime;

          if (task.expirationDate <= task.creationDate) {
            showMessage(locale.tasks.expiration_date_message);
            return;
          }
          const { dateLocale } = getSetting("timeDate") as TimeDateSettings;
          task.expirationDateString = formatDate(task.expirationDate, {
            locale: dateLocale,
            includeTime: true
          });
        }
      }
      else if (state.task.expirationDate) {
        taskProps.expirationDate = undefined;
      }

      if (repeatGap <= 0 && state.task.repeat) {
        taskProps.repeat = undefined;
      }

      if (form.groupId !== selectedGroupId) {
        const groupIndex = groups.findIndex(({ id }) => id === form.groupId);

        replaceGroups([{
          index: groupIndex,
          group: {
            ...groups[groupIndex],
            tasks: groups[groupIndex].tasks.toSpliced(taskIndex, 1)
          }
        },
        {
          index,
          group: {
            ...groups[index],
            tasks: [task, ...groups[index].tasks]
          }
        }], true);
      }
      else {
        replaceGroups([{
          index,
          group: {
            ...groups[index],
            tasks: tasks.with(taskIndex, {
              ...tasks[taskIndex],
              ...task,
              ...taskProps,
              hidden: undefined,
            })
          }
        }], true);
      }
    }
    else {
      if (dateTime) {
        task.expirationDate = new Date(dateTime).getTime();

        if (task.expirationDate <= task.creationDate) {
          showMessage(locale.tasks.expiration_date_message);
          return;
        }
        const { dateLocale } = getSetting("timeDate") as TimeDateSettings;
        task.expirationDateString = formatDate(task.expirationDate, {
          locale: dateLocale,
          includeTime: true
        });
      }
      replaceGroups([{
        index,
        group: {
          ...groups[index],
          tasks: [task, ...groups[index].tasks]
        }
      }], true);
    }
    hide();
  }

  function handleFormKeydown(event: KeyboardEvent) {
    const element = event.target as HTMLElement;

    if (event.key === "Enter" && element.nodeName === "INPUT") {
      event.preventDefault();
    }
  }

  function getFormSubtasks(elements: HTMLInputElement | HTMLInputElement[]): SubtaskType[] {
    if (!elements) {
      return [];
    }
    const input = elements as HTMLInputElement;

    if (input.value) {
      const text = input.value.trim();

      return [getDefaultTask(text, {
        optional: state.task.subtasks[0].optional
      })];
    }

    const inputs = elements as HTMLInputElement[];

    if (inputs.length) {
      const subtasks = [];

      for (let i = 0; i < inputs.length; i += 1) {
        const text = inputs[i].value.trim();

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
    }, [] as Label[]);
  }

  function showLabelForm() {
    setModal({ type: "label" });
  }

  function showGroupForm() {
    setModal({ type: "group" });
  }

  function getDateTimeString(time?: number) {
    const date = time ? new Date(time) : new Date();

    return getDateString(date, true);
  }

  function togglePrefsVisibility() {
    setPrefsVisible(!prefsVisible);
  }

  function togglePref({ target }: ChangeEvent) {
    const element = target as HTMLInputElement;
    let subtasks = state.task.subtasks;

    if (!element.checked) {
      subtasks = subtasks.map(subtask => {
        delete subtask.optional;
        return subtask;
      });
    }
    setState({
      ...state,
      task: {
        ...state.task,
        subtasks
      },
      completeWithSubtasks: element.checked
    });
  }

  function toggleSubtaskReq(index: number) {
    setState({
      ...state,
      task: {
        ...state.task,
        subtasks: state.task.subtasks.with(index, {
          ...state.task.subtasks[index],
          optional: !state.task.subtasks[index].optional
        })
      }
    });
  }

  function handleSort(items: unknown[] | null) {
    if (items) {
      setState({...state, task: { ...state.task, subtasks: items as SubtaskType[] } });
    }
    setActiveDragId("");
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
  }

  function renderSubtask(subtask: SubtaskType, index: number) {
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
                  defaultValue={state.task.expirationDateString}
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
                        <option value="day">{locale.tasks.repeat_label_days}</option>
                        <option value="week">{locale.tasks.repeat_label_weeks}</option>
                        <option value="month">{locale.tasks.repeat_label_months}</option>
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
                <li className="task-form-label" key={label.id}>
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
              placeholder={locale.tasks.details} autoFocus required></textarea>
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
                <span>{locale.tasks.complete_with_subtasks_message}</span>
              </label>
            </div>
          ) : null}
          {state.task.subtasks.length > 0 && (
            <ul className={`task-form-subtasks${activeDragId ? " dragging" : ""}`}>
              <SortableList
                items={state.task.subtasks}
                handleSort={handleSort}
                handleDragStart={handleDragStart}>
                {state.task.subtasks.map((subtask, index) => renderSubtask(subtask, index))}
              </SortableList>
            </ul>
          )}
        </div>
        <div className="container-footer">
          {state.updating ? <button type="button" className="btn text-btn text-negative-btn task-form-delete-btn"
            onClick={removeTask}>{locale.global.delete}</button> : null}
          <button type="button" className="btn text-btn" onClick={hide}>{locale.global.cancel}</button>
          <button type="submit" className="btn task-form-submit-btn">{state.updating ? locale.global.update : locale.global.create}</button>
        </div>
      </form>
      {message ? (
        <Suspense fallback={null}>
          <Toast message={message} position="bottom" offset="40px" locale={locale} dismiss={dismissMessage}/>
        </Suspense>
      ) : null}
      {modal?.type === "label" ? (
        <LabelForm locale={locale} addUniqueLabel={addUniqueLabel} removeTaskLabel={removeTaskLabel}
          hiding={modalHiding} hide={hideModal}/>
      ) : modal?.type === "group" ? (
        <GroupForm locale={locale} createGroup={localCreateGroup} hiding={modalHiding} hide={hideModal} modal/>
      ) : null}
    </>
  );
}
