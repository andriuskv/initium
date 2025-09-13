import type { MouseEvent as ReactMouseEvent } from "react";
import { getLocalStorageItem, fillMissing, dispatchCustomEvent } from "utils";
import { increaseElementZindex, getWidgetState } from "./widgetStates";

type Item = {
  id: string;
  x?: number;
  y?: number;
  translateX: number;
  translateY: number;
  moved?: boolean;
  delayedTarget?: boolean;
}

type Items = { [key: string]: Item };

let items = initItems();
let activeItem: { startClient: { x: number, y: number }, start: { x: number, y: number }, id: string, element: HTMLElement } | null = null;
let checked: { [key: string]: boolean } = {};

checkIfOutside(true);

function initItems() {
  const items = getLocalStorageItem<Partial<Items>>("widgets-pos") || {};
  return fillMissing(items, getDefault()) as Items;
}

function getDefault(): Items {
  return {
    settings: {
      id: "settings",
      translateX: 0.5,
      translateY: 0.5,
      moved: false
    },
    tasks: {
      id: "tasks",
      translateX: 0,
      translateY: 0,
      moved: false,
    },
    weather: {
      id: "weather",
      translateX: 0,
      translateY: 0,
      moved: false,
    },
    stickyNotes: {
      id: "stickyNotes",
      translateX: 0,
      translateY: 0,
      moved: false,
      delayedTarget: true
    },
    shortcuts: {
      id: "shortcuts",
      translateX: 0,
      translateY: 0,
      moved: false,
      delayedTarget: true
    },
    calendar: {
      id: "calendar",
      translateX: 0,
      translateY: 0,
      moved: false,
      delayedTarget: true
    }
  };
}

function resetItemPos() {
  items = getDefault();
  localStorage.removeItem("widgets-pos");

  for (const element of document.querySelectorAll("[data-move-target]") as NodeListOf<HTMLElement>) {
    element.style.setProperty("--x", "");
    element.style.setProperty("--y", "");
    element.classList.remove("moved");
  }
  dispatchCustomEvent("widget-move-init", items);
}

function getItemPos(id: string) {
  return items[id];
}

function handleMoveInit(event: ReactMouseEvent) {
  if (event.button !== 0) {
    return;
  }
  const target = event.target as HTMLElement;
  const buttonElement = target.closest("button");

  if (buttonElement) {
    return;
  }
  const moveTriggerElement = target.closest("[data-move-id]")!;
  const id = moveTriggerElement.getAttribute("data-move-id");

  if (!id) {
    throw new Error("Target id is missing");
  }
  const element = target.closest(`[data-move-target="${id}"]`) as HTMLElement;

  if (!element && !items[id].delayedTarget) {
    throw new Error("Target element is missing");
  }

  if (!items[id]) {
    throw new Error("Invalid item id");
  }
  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left - (rect.width * items[id].translateX);
  const y = event.clientY - rect.top - (rect.height * items[id].translateY);

  activeItem = {
    startClient: { x: event.clientX, y:  event.clientY },
    start: { x, y },
    id,
    element
  };

  document.documentElement.style.userSelect = "none";
  document.documentElement.style.cursor = "move";

  increaseElementZindex(element, id);

  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp, { once: true });
}

async function handlePointerMove(event: MouseEvent) {
  if (!activeItem) {
    return;
  }
  const item = items[activeItem.id];
  const x = (event.clientX - activeItem.start.x) / document.documentElement.clientWidth * 100;
  const y = (event.clientY - activeItem.start.y) / document.documentElement.clientHeight * 100;

  item.x = x;
  item.y = y;

  if (!item.moved && (Math.abs(event.clientX - activeItem.startClient.x) > 5 || Math.abs(event.clientY - activeItem.startClient.y) > 5)) {
    item.moved = true;
    activeItem.element.classList.add("moved");
    dispatchCustomEvent("widget-move-init", { [item.id]: item });

    if (item.delayedTarget) {
      waitForMoveTarget(activeItem.id);
    }
  }
  activeItem.element.style.setProperty("--x", `${x}%`);
  activeItem.element.style.setProperty("--y", `${y}%`);
}

function handlePointerUp() {
  document.documentElement.style.userSelect = "";
  document.documentElement.style.cursor = "";
  window.removeEventListener("pointermove", handlePointerMove);

  if (!activeItem) {
    return;
  }
  const spacing = 8;
  const { clientWidth, clientHeight } = document.documentElement;
  const maxWidth = document.documentElement.clientWidth - spacing;
  const maxHeight = clientHeight - spacing;
  const rect = activeItem.element.getBoundingClientRect();
  const item = items[activeItem.id];
  const { translateX, translateY } = item;
  let x = item.x;
  let y = item.y;

  if (rect.left + rect.width > maxWidth) {
    x = (maxWidth - rect.width + (rect.width * translateX)) / clientWidth * 100;
  }
  else if (rect.left < 0) {
    x = ((rect.width * translateX) + spacing) / clientWidth * 100;
  }
  item.x = x;
  activeItem.element.style.setProperty("--x", `${x}%`);

  if (rect.top + rect.height > maxHeight) {
    y = (maxHeight - rect.height + (rect.height * translateY)) / clientHeight * 100;
  }
  else if (rect.top < 0) {
    y = ((rect.height * translateY) + spacing) / clientHeight * 100;
  }
  item.y = y;
  activeItem.element.style.setProperty("--y", `${y}%`);
  activeItem = null;

  dispatchCustomEvent("widget-move-init", { [item.id]: item });
  localStorage.setItem("widgets-pos", JSON.stringify(items));
}

function waitForMoveTarget(id: string) {
  window.requestAnimationFrame(() => {
    const updated = updateMoveTarget(id);

    if (updated) {
      return;
    }
    waitForMoveTarget(id);
  });
}

function updateMoveTarget(id: string) {
  const element = document.querySelector(`[data-move-target="${id}"]`) as HTMLElement;

  if (!element || !activeItem || element.classList.contains("container")) {
    return;
  }
  const item = items[id];

  activeItem.element = element;
  element.style.setProperty("--x", `${item.x}%`);
  element.style.setProperty("--y", `${item.y}%`);
  element.classList.add("moved");
  increaseElementZindex(element, id);
  return true;
}

function checkIfOutside(waitForTarget = false) {
  const spacing = 8;
  let count = 0;

  for (const id of Object.keys(items)) {
    const item = items[id];

    if (item.moved && !checked[id]) {
      const state = getWidgetState(id);

      if (state.opened) {
        const element = document.querySelector(`[data-move-target="${id}"]`) as HTMLElement;

        if (waitForTarget) {
          count += 1;
        }

        if (!element) {
          continue;
        }
        const rect = element.getBoundingClientRect();
        const maxWidth = document.documentElement.clientWidth - spacing;
        const maxHeight = document.documentElement.clientHeight - spacing;

        if (rect.width < maxWidth) {
          if (rect.width + rect.left > maxWidth) {
            element.style.setProperty("--x", `${(maxWidth - rect.width) / document.documentElement.clientWidth * 100}%`);
          }
          else if (rect.left < spacing) {
            element.style.setProperty("--x", `${spacing / document.documentElement.clientWidth * 100}%`);
          }
        }

        if (rect.height < maxHeight) {
          if (rect.height + rect.top > maxHeight) {
            element.style.setProperty("--y", `${(maxHeight - rect.height) / document.documentElement.clientHeight * 100}%`);
          }
          else if (rect.top < spacing) {
            element.style.setProperty("--y", `${spacing / document.documentElement.clientHeight * 100}%`);
          }
        }
        checked[id] = true;
        count -= 1;
      }
    }
  }

  if (count > 0 && waitForTarget) {
    requestAnimationFrame(() => {
      checkIfOutside(true);
    });
  }
  else {
    checked = {};
  }
}

window.addEventListener("resize", () => {
  checkIfOutside();
});

export {
  resetItemPos,
  getItemPos,
  handleMoveInit,
  updateMoveTarget
};
