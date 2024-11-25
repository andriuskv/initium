import { delay, findFocusableElements } from "utils";

type Trap = {
  first: HTMLElement,
  last: HTMLElement,
  isDropdown: boolean,
  initiator: HTMLElement | null,
  container: HTMLElement
}
const traps: { [key: string]: Trap } = {};
let stack: string[] = [];
let activeTrapId = "";
let initiator: HTMLElement | null = null;
let ignoreNext: boolean | undefined = false;

function setInitiator(element: HTMLElement | null = null) {
  if (stack.at(-1) === "dropdown") {
    initiator = traps.dropdown.initiator;
    delete traps.dropdown;
    stack.pop();
  }
  else {
    initiator = element;
  }
}

function focusInitiator(id: string) {
  const trap = traps[id];

  if (trap?.initiator) {
    if (trap.isDropdown) {
      if (trap.container.contains(document.activeElement)) {
        focusElement(trap.initiator);
      }
    }
    else {
      focusElement(trap.initiator);
    }
  }
}

function trapFocus(id: string, container: HTMLElement, { excludeDropdown = true } = {}) {
  const focusableElements = findFocusableElements(container, excludeDropdown);

  if (!focusableElements.length) {
    return;
  }
  activeTrapId = id;
  traps[id] = {
    initiator,
    container,
    isDropdown: !excludeDropdown,
    first: focusableElements[0],
    last: focusableElements.at(-1)!
  };

  stack.push(id);

  if (!focusableElements.some(element => element.getAttribute("autofocus"))) {
    focusElement(traps[id].first);
  }

  if (stack.length === 1) {
    document.addEventListener("keydown", handleKeyDown);
  }
}

function clearFocusTrap(id: string) {
  delete traps[id];
  stack = stack.filter(item => item !== id);

  if (stack.length) {
    activeTrapId = stack.at(-1)!;
  }
  else {
    activeTrapId = "";
    initiator = null;

    document.removeEventListener("keydown", handleKeyDown);
  }
}

async function updateFocusTrap(id: string) {
  const currentTrap = traps[id];

  if (!currentTrap) {
    return;
  }
  await delay(200);

  const elements = findFocusableElements(currentTrap.container, true);

  if (!elements.length) {
    clearFocusTrap(id);
    return;
  }
  currentTrap.first = elements[0];
  currentTrap.last = elements.at(-1)!;
}

function focusElement(element: HTMLElement) {
  if (ignoreNext) {
    ignoreNext = false;
    return;
  }
  element.focus();
}

function focusFirstElement(container: HTMLElement, { excludeDropdown = true } = {}) {
  focusNthElement(container, 0, { excludeDropdown });
}

function focusNthElement(container: HTMLElement, index: number, options: { excludeDropdown?: boolean, ignoreNext?: boolean } = { excludeDropdown: true, ignoreNext: false }) {
  const focusableElements = findFocusableElements(container, options.excludeDropdown);

  if (!focusableElements.length || !focusableElements[index]) {
    return;
  }
  setTimeout(() => {
    focusElement(focusableElements[index]);
    ignoreNext = options.ignoreNext;
  }, 100);
}

function focusSelector(selector: string) {
  const element = document.querySelector(selector) as HTMLElement;

  if (element) {
    focusElement(element);
  }
}

function resetIgnore() {
  ignoreNext = false;
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key !== "Tab") {
    return;
  }
  const trap = traps[activeTrapId];

  if (event.shiftKey) {
    if (document.activeElement === trap.first) {
      if (trap.isDropdown) {
        clearFocusTrap(activeTrapId);
      }
      else {
        event.preventDefault();
        focusElement(trap.last);
      }
    }
  }
  else if (document.activeElement === trap.last) {
    if (trap.isDropdown) {
      clearFocusTrap(activeTrapId);
    }
    else {
      event.preventDefault();
      focusElement(trap.first);
    }
  }
}

export {
  setInitiator,
  focusInitiator,
  focusFirstElement,
  focusNthElement,
  focusSelector,
  resetIgnore,
  trapFocus,
  clearFocusTrap,
  updateFocusTrap
};
