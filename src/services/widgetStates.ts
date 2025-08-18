import type { MouseEvent } from "react";
import { getLocalStorageItem } from "utils";
import { getSetting } from "./settings";
import type { GeneralSettings } from "types/settings";

type Widget = {
  zIndex: number,
  opened: boolean
};

const states = getLocalStorageItem<{ [key: string]: Widget }>("widget-states") || {};
let topWidget: { name: string, index: number } | null = null;
let timeoutId = 0;

for (const id of Object.keys(states)) {
  if (typeof states[id] === "boolean") {
    states[id] = { opened: states[id], zIndex: 1 };
  }
}

function getWidgetState(name: string) {
  states[name] ??= { opened: false, zIndex: 1 };
  return states[name];
}

function setWidgetState(id: string, state: Partial<Widget>) {
  states[id] = { ...states[id], ...state };
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
    const state = getWidgetState(name);

    (currentTarget as HTMLElement).style.setProperty("--z-index", index.toString());

    if (state?.opened) {
      setWidgetState(name, { ...state, zIndex: index });
    }
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
  resetIndexes
};
