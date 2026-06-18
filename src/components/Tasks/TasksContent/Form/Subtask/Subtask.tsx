import { useState, type PropsWithChildren } from "react";
import type { DragStartEvent } from "@dnd-kit/core";
import type { Subtask as SubtaskType, TaskType } from "../../../tasks.type";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import "./subtask.css";
import { SortableList, SortableItem } from "@/components/Sortable";

type Props = PropsWithChildren & {
  index: number,
  subtask: SubtaskType,
  locale: any,
  completeWithSubtasks: boolean,
  level?: number,
  addFormSubtask: (parentTask: TaskType | SubtaskType) => void,
  toggleSubtaskReq: (parentTaskId: string, index: number) => void,
  removeFormSubtask: (parentTaskId: string, index: number) => void,
  sortNestedSubtasks: (parentTaskId: string, items: unknown[]) => void
}

function getSymbol(level: number, index: number) {
  const SYMBOLS_LIST: Record<number, string | string[]> = {
    0: "1234567890",
    1: "abcdefghijklmnopqrstuvwxyz",
    2: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    3: "αβγδεζηθικλμνξοπρστυφχψω",
    4: "אבגדהוזחטיכלמנסעפצקרשת",
    5: "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛟᛞ",
    6: "♈♉♊♋♌♍♎♏♐♑♒♓",
    7: "♔♕♖♗♘♙♚♛♜♝♞♟",
    8: ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"],
    9: ["💀", "👽", "👾", "👁️", "🧠", "🦷", "🦴", "🩸"],
    10: ["À̸̜͇͚͎̮̠ͅ", "a̷̞͉͆͑̂̋͠", "u̴̪̖̞̬͓̼͔̹͆̓̀̽̇͐̾̇̀", "ű̶͇͓̥̝̝̣̑̎̈́", "e̸̺͌̉̆̈́͊̂", "u̸̐̌̓́̊͑̕͠ͅ", "e̷̢̫̻͕̗̬̘̿͌̓", "e̴̫̟̞̐͐̇́̈́̄͜", "g̸̡̤͋̈́̑", "g̵̢̢̤͎͕̪̩̈͋̿̅͆̈͐", "g̸̣̻̳̙̦̪̠̱̔ͅ", "h̷̢͒̇̅̒͑", "ḧ̴̗̟̹̮̎̃̈́̆̕͝", "h̷̛̭̟͎̀̑͆̌͗́͛͘", "h̶̛͈̺͙̞̘̺̤̿͌͋͗̅̈́̔̓ͅͅ", "h̴̼̙̋̿̇̔̌̊͛", "h̷̪̲̘͉̤̬͓̦͋̔͌̎̀͝͠ͅ", "h̵̺͍͎̭̠̩̻̽͆͠", "h̵̤̺̎̀́̍͘̚"]
  };

  const rawSymbols = SYMBOLS_LIST[level] || SYMBOLS_LIST[10];
  const symbols = typeof rawSymbols === "string" ? Array.from(rawSymbols) : rawSymbols;
  let startIndex = index;
  let symbol = "";

  if (level === 0 && index === symbols.length - 1) {
    return "10";
  }

  while (startIndex >= symbols.length) {
    const indexSymbol = Math.floor(startIndex / symbols.length) - 1;
    const remainder = startIndex % symbols.length;

    symbol += getSymbol(level, indexSymbol);
    startIndex = remainder;
  }
  symbol += symbols[startIndex];
  return symbol;
}

export default function Subtask({ children, index, subtask, locale, level = 0, completeWithSubtasks, addFormSubtask, toggleSubtaskReq, removeFormSubtask, sortNestedSubtasks }: Props) {
  const [activeDragId, setActiveDragId] = useState("");
  const symbol = getSymbol(level, index);

  function handleSort(items: unknown[] | null) {
    if (items) {
      sortNestedSubtasks(subtask.id, items);
    }
    setActiveDragId("");
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
  }

  function renderSubtask(sub: SubtaskType, index: number) {
    const component = {
      Component: Subtask,
      params: {
        index,
        subtask: sub,
        parentTask: sub,
        level: level + 1,
        locale,
        completeWithSubtasks,
        toggleSubtaskReq,
        addFormSubtask,
        removeFormSubtask,
        sortNestedSubtasks
      }
    };

    return (
      <SortableItem className={`task-form-subtask${sub.id === activeDragId ? " dragging" : ""}`}
        component={component} id={sub.id} key={sub.id} handleTitle={locale.global.drag} />
    );
  }

  return (
    <>
      <div className="task-form-subtask-content">
        <div className="task-form-subtask-index-container">
          <span className="task-form-subtask-index">{symbol}{subtask.optional ? "*" : ""}</span>
          {children}
        </div>
        <input type="text" name="subtask" className="input task-form-subtask-input"
          defaultValue={subtask.rawText} autoComplete="off" data-subtask-id={subtask.id} />
        <Dropdown>
          <button type="button" className="btn icon-text-btn dropdown-btn" onClick={() => addFormSubtask(subtask)}>
            <Icon id="plus" />
            <span>{locale.tasks.add_subtask_title}</span>
          </button>
          {completeWithSubtasks ? (
            <button type="button" className="btn icon-text-btn dropdown-btn icon-placeholder"
              onClick={() => toggleSubtaskReq(subtask.id, index)}>
              <span>{subtask.optional ? locale.tasks.make_required : locale.tasks.make_optional}</span>
            </button>
          ) : null}
          <button type="button" className="btn icon-text-btn dropdown-btn" onClick={() => removeFormSubtask(subtask.id, index)}>
            <Icon id="trash" />
            <span>{locale.global.remove}</span>
          </button>
        </Dropdown>
      </div>
      {subtask.subtasks && subtask.subtasks.length > 0 && (
        <ul className={`task-form-subtask-subtasks${activeDragId ? " dragging" : ""}`}>
          <SortableList
            items={subtask.subtasks}
            handleSort={handleSort}
            handleDragStart={handleDragStart}>
            {subtask.subtasks?.map((subtask, index) => renderSubtask(subtask, index))}
          </SortableList>
        </ul>
      )}
    </>
  );
}
