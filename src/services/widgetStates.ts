import { getLocalStorageItem } from "utils";

const states = getLocalStorageItem<{ [key: string]: boolean }>("widget-states") || {};

function getWidgetState(id: string) {
  return states[id];
}

function setWidgetState(id: string, state: boolean) {
  states[id] = state;
  localStorage.setItem("widget-states", JSON.stringify(states));
}

export { getWidgetState, setWidgetState };
