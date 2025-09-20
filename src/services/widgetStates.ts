import type { MouseEvent as ReactMouseEvent } from "react";
import type { GeneralSettings } from "types/settings";
import { getLocalStorageItem, fillMissing, dispatchCustomEvent, timeout } from "utils";
import { getSetting } from "./settings";

type Item = {
  id: string;
  zIndex: number;
  x?: number;
  y?: number;
  translateX?: number;
  translateY?: number;
  moved: boolean;
  opened: boolean;
  delayedTarget?: boolean;
}

type Items = { [key: string]: Item };

let items = initItems();
let topWidget: { id: string, index: number } = initTopWidget(items);
let activeItem: { startClient: { x: number, y: number }, start: { x: number, y: number }, id: string, element: HTMLElement } | null = null;
let indicator: HTMLElement | null = null;
let dockPos: { id: string, x: number, y: number } | null = null;
let observers: { [key: string]: ResizeObserver } = {};
let saveTimeoutId = 0;
const spacing = 8;

checkIfOutside(true);

window.addEventListener("resize", () => {
  checkIfOutside();
});

function initItems() {
  let items = getLocalStorageItem<Items>("widgets-pos") || {};
  items = fillMissing(items, getDefault()) as Items;
  const states = getLocalStorageItem<Items>("widget-states");

  if (states) {
    for (const id of Object.keys(states)) {
      if (typeof states[id] === "boolean") {
        items[id] = { ...items[id], opened: states[id], zIndex: 1 };
      }
      else {
        items[id] = { ...items[id], ...states[id] };
      }
    }
    save();
    localStorage.removeItem("widget-states");
  }

  const sortedState = Object.entries(items).toSorted((a, b) => a[1].zIndex - b[1].zIndex);
  let zIndex = 0;

  for (let i = 0; i < sortedState.length; i++) {
    sortedState[i][1].zIndex = zIndex + 1;
    zIndex += 1;
  }
  return Object.fromEntries(sortedState);
}

function getDefault(): Items {
  return {
    settings: {
      id: "settings",
      zIndex: 1,
      translateX: 0.5,
      translateY: 0.5,
      opened: false,
      moved: false
    },
    tasks: {
      id: "tasks",
      zIndex: 1,
      opened: false,
      moved: false
    },
    weather: {
      id: "weather",
      zIndex: 1,
      opened: false,
      moved: false
    },
    topPanel: {
      id: "topPanel",
      zIndex: 1,
      opened: false,
      moved: false
    },
    mainPanel: {
      id: "mainPanel",
      zIndex: 1,
      opened: false,
      moved: false
    },
    secondaryPanel: {
      id: "secondaryPanel",
      zIndex: 1,
      opened: false,
      moved: false
    },
    stickyNotes: {
      id: "stickyNotes",
      zIndex: 1,
      opened: false,
      moved: false,
      delayedTarget: true
    },
    shortcuts: {
      id: "shortcuts",
      zIndex: 1,
      opened: false,
      moved: false,
      delayedTarget: true
    },
    calendar: {
      id: "calendar",
      zIndex: 1,
      opened: false,
      moved: false,
      delayedTarget: true
    },
    fullscreenModal: {
      id: "fullscreenModal",
      zIndex: 1,
      opened: false,
      moved: false
    }
  };
}

function initTopWidget(items: Items) {
  let top = null;
  let max = 0;

  for (const id of Object.keys(items)) {
    if (items[id].zIndex > max) {
      max = items[id].zIndex;
      top = { id, index: max };
    }
  }
  return top as { id: string, index: number };
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

  for (const observer of Object.values(observers)) {
    observer.disconnect();
  }
  observers = {};
}

function getWidgetState(id: string) {
  if (!items[id]) {
    throw new Error(`Widget with the ${id} not found`);
  }
  return items[id];
}

function setWidgetState(id: string, state: Partial<Item>) {
  items[id] = { ...getWidgetState(id), ...state };
  save();
}

function getZIndex(id: string): number {
  const index = topWidget ? topWidget.index + 1 : 2;
  topWidget = { id, index };

  if (!items[id]) {
    throw new Error(`Widget with the ${id} not found`);
  }
  items[id].zIndex = index;
  return index;
}

function increaseZIndex(id: string): number {
  if (topWidget.id === id) {
    return items[id].zIndex;
  }
  const zIndex = getZIndex(id);

  save();
  return zIndex;
}

function handleZIndex({ currentTarget }: ReactMouseEvent, id: string) {
  if (topWidget.id === id) {
    return;
  }

  if (currentTarget) {
    const index = getZIndex(id);

    (currentTarget as HTMLElement).style.setProperty("--z-index", index.toString());
    save();
  }
}

function initElementZindex(element: HTMLElement | null, id: string) {
  if (element) {
    element.style.setProperty("--z-index", getWidgetState(id).zIndex.toString());
  }
}

function increaseElementZindex(element: HTMLElement | null, id: string) {
  if (element) {
    element.style.setProperty("--z-index", increaseZIndex(id).toString());
  }
}

function resetIndexes() {
  for (const id of Object.keys(items)) {
    items[id].zIndex = 1;
  }
  topWidget.index = 1;
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
  const item = items[id];

  if (!item) {
    throw new Error("Invalid item id");
  }

  if (!element && !item.delayedTarget) {
    throw new Error("Target element is missing");
  }
  const rect = element.getBoundingClientRect();
  const { translateX = 0, translateY = 0 } = item;
  const x = event.clientX - rect.left - (rect.width * translateX);
  const y = event.clientY - rect.top - (rect.height * translateY);

  dockPos = getDockPos(id, rect);
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
  const xpx = event.clientX - activeItem.start.x;
  const ypx = event.clientY - activeItem.start.y;
  const x = xpx / document.documentElement.clientWidth * 100;
  const y = ypx / document.documentElement.clientHeight * 100;

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
  else if (dockPos) {
    let canDock = false;

    if (dockPos.id === "top-left" && xpx < dockPos.x && ypx < dockPos.y) {
      canDock = true;
    }
    else if (dockPos.id === "top-right" && xpx > dockPos.x && ypx < dockPos.y) {
      canDock = true;
    }
    else if (dockPos.id === "bottom-right" && xpx > dockPos.x && ypx > dockPos.y) {
      canDock = true;
    }
    else if (dockPos.id === "bottom-left" && xpx < dockPos.x && ypx > dockPos.y) {
      canDock = true;
    }

    if (canDock) {
      if (!indicator) {
        createDockIndicator(dockPos.id);
      }
    }
    else if (indicator) {
      document.body.removeChild(indicator);
      indicator = null;
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
  const item = items[activeItem.id];
  dockPos = null;

  if (indicator) {
    if (observers[activeItem.id]) {
      observers[activeItem.id].disconnect();
      delete observers[activeItem.id];
    }
    indicator.remove();
    indicator = null;
    item.moved = false;
    activeItem = null;
    dispatchCustomEvent("widget-move-init", { [item.id]: item });
    save();
    return;
  }
  const { clientWidth, clientHeight } = document.documentElement;
  const maxWidth = document.documentElement.clientWidth - spacing;
  const maxHeight = clientHeight - spacing;
  const rect = activeItem.element.getBoundingClientRect();
  const { translateX = 0, translateY = 0 } = item;
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
  save();
}

function getDockPos(id: string, rect: DOMRect) {
  const { placement } = getSetting("general") as GeneralSettings;
  const posMap = {
    "top-left": {
      x: spacing,
      y: spacing
    },
    "top-right": {
      x: document.documentElement.clientWidth - rect.width - spacing,
      y: spacing
    },
    "bottom-left": {
      x: spacing,
      y: document.documentElement.clientHeight - rect.height - spacing
    },
    "bottom-right": {
      x: document.documentElement.clientWidth - rect.width - spacing,
      y: document.documentElement.clientHeight - rect.height - spacing
    }
  };

  for (const key of Object.keys(placement)) {
    const pos: keyof typeof placement = key as keyof typeof placement;

    if (placement[pos].id === id) {
      return {
        id: pos,
        ...posMap[pos]
      };
    }
    else if (placement[pos].id === "secondary" && ["stickyNotes", "shortcuts", "calendar"].includes(id)) {
      return {
        id: pos,
        ...posMap[pos]
      };
    }
  }
  return null;
}

function createDockIndicator(dockPos: string) {
  indicator = document.createElement("div");
  indicator.classList.add("dock-indicator", "dock-pos", `dock-pos-${dockPos}`);
  document.body.appendChild(indicator);
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

function fitElement(element: HTMLElement) {
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
}

function checkIfOutside(waitForTarget = false, checked: { [key: string]: boolean } = {}) {
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
        fitElement(element);
        checked[id] = true;
        count -= 1;
      }
    }
  }

  if (count > 0 && waitForTarget) {
    requestAnimationFrame(() => {
      checkIfOutside(true, checked);
    });
  }
}

function observeElement(id: string) {
  const element = document.querySelector(`[data-move-target="${id}"]`) as HTMLElement;

  if (!element || !items[id].moved) {
    return;
  }

  if (observers[id]) {
    observers[id].disconnect();
  }
  observers[id] = new ResizeObserver((entries) => {
    for (const entry of entries) {
      fitElement(entry.target as HTMLElement);
    }
  });
  observers[id].observe(element);
}

function save() {
  saveTimeoutId = timeout(() => {
    localStorage.setItem("widgets-pos", JSON.stringify(items));
  }, 200, saveTimeoutId);
}

export {
  getWidgetState,
  setWidgetState,
  increaseZIndex,
  handleZIndex,
  initElementZindex,
  increaseElementZindex,
  resetIndexes,
  resetItemPos,
  handleMoveInit,
  updateMoveTarget,
  observeElement
};
