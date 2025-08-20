import type { MouseEvent } from "react";
import { getLocalStorageItem } from "utils";
import { getSetting } from "./settings";
import type { GeneralSettings } from "types/settings";

type Widget = {
  zIndex: number,
  opened: boolean
};

const states = getLocalStorageItem<{ [key: string]: Widget }>("widget-states") || {};
let topWidget: { name: string, index: number } | null = initTopWidget();
let timeoutId = 0;

for (const id of Object.keys(states)) {
  if (typeof states[id] === "boolean") {
    states[id] = { opened: states[id], zIndex: 1 };
  }
}

function initTopWidget() {
  let top = null;
  let max = 0;

  for (const id of Object.keys(states)) {
    if (states[id].zIndex > max) {
      max = states[id].zIndex;
      top = { name: id, index: max };
    }
  }
  return top;
}

function getWidgetState(name: string) {
  states[name] ??= { opened: false, zIndex: 1 };
  return states[name];
}

function setWidgetState(id: string, state: Partial<Widget>) {
  states[id] = { ...getWidgetState(id), ...state };
  save();
}

function getZIndex(name: string): number {
  const index = topWidget ? topWidget.index + 1 : 2;
  topWidget = { name, index };

  if (states[name]) {
    states[name].zIndex = index;
    return index;
  }
  states[name] = { opened: false, zIndex: index };
  return index;
}

function increaseZIndex(name: string): number {
  if (topWidget?.name === name) {
    return states[name].zIndex;
  }
  const zIndex = getZIndex(name);

  save();
  return zIndex;
}

function handleZIndex({ currentTarget }: MouseEvent, name: string) {
  if (topWidget?.name === name) {
    return;
  }

  if (currentTarget) {
    const index = getZIndex(name);

    (currentTarget as HTMLElement).style.setProperty("--z-index", index.toString());
    save();
  }
}

function initElementZindex(element: HTMLElement | null, name: string) {
  if (element) {
    element.style.setProperty("--z-index", getWidgetState(name).zIndex.toString());
  }
}

function increaseElementZindex(element: HTMLElement | null, name: string) {
  if (element) {
    element.style.setProperty("--z-index", increaseZIndex(name).toString());
  }
}

function resetIndexes() {
  for (const id of Object.keys(states)) {
    states[id] = { ...states[id], zIndex: 1 };
  }
  topWidget = null;
}

function save() {
  clearTimeout(timeoutId);
  timeoutId = window.setTimeout(() => {
    const { rememberWidgetState } = getSetting("general") as GeneralSettings;
    let newStates: { [key: string]: Widget } = {};

    if (rememberWidgetState) {
      newStates = states;
    }
    else {
      for (const id of Object.keys(states)) {
        newStates[id] = { opened: false, zIndex: 1 };
      }
    }
    localStorage.setItem("widget-states", JSON.stringify(newStates));
  }, 200);
}

export {
  getWidgetState,
  setWidgetState,
  increaseZIndex,
  handleZIndex,
  initElementZindex,
  increaseElementZindex,
  resetIndexes
};
