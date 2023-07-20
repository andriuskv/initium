import { delay } from "utils";

const traps = {};
let stack = [];
let activeTrapId = "";
let initiator = null;

function setInitiator(element) {
  if (stack.at(-1) === "dropdown") {
    initiator = traps.dropdown.initiator;
    delete traps.dropdown;
    stack.pop();
  }
  else {
    initiator = element;
  }
}

function focusInitiator(id) {
  const trap = traps[id];

  if (trap) {
    if (trap.isDropdown) {
      if (trap.container.contains(document.activeElement)) {
        trap.initiator.focus();
      }
    }
    else {
      trap.initiator.focus();
    }
  }
}

function trapFocus(id, container, { excludeDropdown = true } = {}) {
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
    last: focusableElements.at(-1)
  };

  stack.push(id);
  traps[id].first.focus();

  if (stack.length === 1) {
    document.addEventListener("keydown", handleKeyDown);
  }
}

function clearFocusTrap(id) {
  delete traps[id];
  stack = stack.filter(item => item !== id);

  if (stack.length) {
    activeTrapId = stack.at(-1);
  }
  else {
    activeTrapId = "";
    initiator = null;

    document.removeEventListener("keydown", handleKeyDown);
  }
}

async function updateFocusTrap(id) {
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
  currentTrap.last = elements.at(-1);
}

function focusFirstElement(container, { excludeDropdown = true } = {}) {
  const focusableElements = findFocusableElements(container, excludeDropdown);

  if (!focusableElements.length) {
    return;
  }
  focusableElements[0].focus();
}

function handleKeyDown(event) {
  if (event.key === "Tab") {
    const trap = traps[activeTrapId];

    if (event.shiftKey) {
      if (document.activeElement === trap.first) {
        if (trap.isDropdown) {
          clearFocusTrap(activeTrapId);
        }
        else {
          event.preventDefault();
          trap.last.focus();
        }
      }
    }
    else if (document.activeElement === trap.last) {
      if (trap.isDropdown) {
        clearFocusTrap(activeTrapId);
      }
      else {
        event.preventDefault();
        trap.first.focus();
      }
    }
  }
}

function findFocusableElements(container, excludeDropdown) {
  const elements = Array.from(container.querySelectorAll("button:not(:disabled), input:not(:disabled), a[href], [tabindex]"));

  if (excludeDropdown) {
    return elements.filter(element => !element.closest(".dropdown"));
  }
  return elements;
}

export {
  setInitiator,
  focusInitiator,
  focusFirstElement,
  trapFocus,
  clearFocusTrap,
  updateFocusTrap
};
