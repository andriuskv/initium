import type { MouseEvent as ReactMouseEvent } from "react";

let items: { [key: string]: { x: number, y: number } } = JSON.parse(localStorage.getItem("widgets-pos") ?? "{}");
let activeItem: { start: { x: number, y: number }, id: string, element: HTMLElement } | null = null;

function resetItemPos() {
  items = {};
  localStorage.removeItem("widgets-pos");

  for (const element of document.querySelectorAll("[data-move-target]") as NodeListOf<HTMLElement>) {
    element.style.setProperty("--x", "50");
    element.style.setProperty("--y", "50");
  }
}

function getItemPos(id: string) {
  return items[id] ?? { x: 50, y: 50 };
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
  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left - (rect.width / 2);
  const y = event.clientY - rect.top - (rect.height / 2);
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

  if (items[activeItem.id]) {
    items[activeItem.id].x = x;
    items[activeItem.id].y = y;
  }
  else {
    items[activeItem.id] = { x, y };
  }

  activeItem.element.style.setProperty("--x", x.toString());
  activeItem.element.style.setProperty("--y", y.toString());
}

function handlePointerUp() {
  document.documentElement.style.userSelect = "";
  document.documentElement.style.cursor = "";
  window.removeEventListener("pointermove", handlePointerMove);

  if (!activeItem) {
    return;
  }
  const spacing = 8;
  const maxWidth = document.documentElement.clientWidth - spacing;
  const maxHeight = document.documentElement.clientHeight - spacing;
  const rect = activeItem.element.getBoundingClientRect();
  let x = items[activeItem.id].x;
  let y = items[activeItem.id].y;

  if (rect.left + rect.width > maxWidth) {
    x = (maxWidth - rect.width + (rect.width / 2)) / document.documentElement.clientWidth * 100;
  }
  else if (rect.left < 0) {
    x = ((rect.width / 2) + spacing) / document.documentElement.clientWidth * 100;
  }
  items[activeItem.id].x = x;
  activeItem.element.style.setProperty("--x", x.toString());

  if (rect.top + rect.height > maxHeight) {
    y = (maxHeight - rect.height + (rect.height / 2)) / document.documentElement.clientHeight * 100;
  }
  else if (rect.top < 0) {
    y = ((rect.height / 2) + spacing) / document.documentElement.clientHeight * 100;
  }
  items[activeItem.id].y = y;
  activeItem.element.style.setProperty("--y", y.toString());

  activeItem = null;
  localStorage.setItem("widgets-pos", JSON.stringify(items));
}

export {
  resetItemPos,
  getItemPos,
  handleMoveInit,
};
