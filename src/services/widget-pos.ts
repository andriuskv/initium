import type { MouseEvent as ReactMouseEvent } from "react";
import { getLocalStorageItem, fillMissing } from "utils";

type Item = {
  x: number;
  y: number;
  translateX: number;
  translateY: number;
  units: "px" | "%";
  moved?: boolean;
}

type Items = { [key: string]: Item };

let items = init();
let activeItem: { start: { x: number, y: number }, id: string, element: HTMLElement } | null = null;

function init() {
  const items = getLocalStorageItem<Partial<Items>>("widgets-pos") || {};
  return fillMissing(items, getDefault()) as Items;
}

function getDefault(): Items {
  return convertUnits({
    settings: {
      x: 50,
      y: 50,
      translateX: 0.5,
      translateY: 0.5,
      units: "%"
    },
    tasks: {
      x: 8,
      y: 8,
      translateX: 0,
      translateY: 0,
      units: "px"
    }
  } as Items);
}

function resetItemPos() {
  items = getDefault();
  localStorage.removeItem("widgets-pos");

  for (const element of document.querySelectorAll("[data-move-target]") as NodeListOf<HTMLElement>) {
    element.style.setProperty("--x", "");
    element.style.setProperty("--y", "");
    element.classList.remove("moved");
  }
}

function convertUnits(items: Items): Items {
  for (const id of Object.keys(items)) {
    const item = items[id];

    if (item.units === "px") {
      item.x = (item.x / document.documentElement.clientWidth) * 100;
      item.y = (item.y / document.documentElement.clientHeight) * 100;
      item.units = "%";
    }
  }
  return items;
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

  if (!element) {
    throw new Error("Target element is missing");
  }

  if (!items[id]) {
    items[id] = getDefault()[id];
  }
  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left - (rect.width * items[id].translateX);
  const y = event.clientY - rect.top - (rect.height * items[id].translateY);

  activeItem = {
    start: { x, y },
    id,
    element
  };

  document.documentElement.style.userSelect = "none";
  document.documentElement.style.cursor = "move";

  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp, { once: true });
}

function handlePointerMove(event: MouseEvent) {
  if (!activeItem) {
    return;
  }
  const x = (event.clientX - activeItem.start.x) / document.documentElement.clientWidth * 100;
  const y = (event.clientY - activeItem.start.y) / document.documentElement.clientHeight * 100;
  const item = items[activeItem.id];

  item.x = x;
  item.y = y;
  item.moved = true;

  activeItem.element.style.setProperty("--x", `${x}%`);
  activeItem.element.style.setProperty("--y", `${y}%`);
  activeItem.element.classList.add("moved");
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
  localStorage.setItem("widgets-pos", JSON.stringify(items));
}

export {
  resetItemPos,
  getItemPos,
  handleMoveInit,
};
