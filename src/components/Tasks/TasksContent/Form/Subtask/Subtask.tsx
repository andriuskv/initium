import type { Subtask } from "../../../tasks.type";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import "./subtask.css";
import type { PropsWithChildren } from "react";

type Props = PropsWithChildren & {
  index: number,
  subtask: Subtask,
  locale: any,
  completeWithSubtasks: boolean,
  toggleSubtaskReq: (index: number) => void,
  removeFormSubtask: (index: number) => void,
}

export default function Subtask({ children, index, subtask, locale, completeWithSubtasks, toggleSubtaskReq, removeFormSubtask }: Props) {
  return (
    <>
      <div className="task-form-subtask-index-container">
        <span className="task-form-subtask-index">{index + 1}{subtask.optional ? "*" : ""}</span>
        {children}
      </div>
      <input type="text" name="subtask" className="input task-form-subtask-input"
        defaultValue={subtask.rawText} autoComplete="off"/>
      {completeWithSubtasks ? (
        <Dropdown>
          <button type="button" className="btn icon-text-btn dropdown-btn icon-placeholder"
            onClick={() => toggleSubtaskReq(index)}>
            <span>{subtask.optional ? locale.tasks.make_required : locale.tasks.make_optional}</span>
          </button>
          <button type="button" className="btn icon-text-btn dropdown-btn" onClick={() => removeFormSubtask(index)}>
            <Icon id="trash"/>
            <span>{locale.global.remove}</span>
          </button>
        </Dropdown>
      ) : (
        <button type="button" className="btn icon-btn alt-icon-btn"
          onClick={() => removeFormSubtask(index)} title={locale.global.remove}>
          <Icon id="trash"/>
        </button>
      )}
    </>
  );
}
