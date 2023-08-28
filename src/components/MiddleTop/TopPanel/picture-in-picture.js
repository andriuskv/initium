import { dispatchCustomEvent } from "utils";

const pipSupported = "documentPictureInPicture" in window;
let pipWindow = null;
let timerActions = {};
let activeTimer = "";

function isSupported() {
  // return pipSupported;
  return false;
}

function isActive() {
  return !!pipWindow;
}

function toggle(params) {
  if (pipWindow) {
    if (params.name === activeTimer) {
      pipWindow.close();
    }
    else {
      cleanup();
      init(params);
    }
  }
  else {
    init(params);
  }
}

function close(name) {
  if (!pipWindow || name !== activeTimer) {
    return;
  }
  pipWindow.close();
  cleanup();
}

function cleanup() {
  dispatchCustomEvent("pip-close", activeTimer);
  pipWindow.removeEventListener("unload", cleanup, { once: true });
  pipWindow.document.body.removeEventListener("click", handleClick);
  pipWindow = null;
  activeTimer = "";
  timerActions = {};
}

async function init({ name, title, data, toggle }) {
  activeTimer = name;
  timerActions[name] = { toggle };
  pipWindow = await window.documentPictureInPicture.requestWindow();

  await copyStyleSheets(pipWindow.document.head);

  pipWindow.document.head.insertAdjacentHTML("beforeend", `
    <title>${title} | Initium</title>
    <style>
      body {
        --size-multiplier: 1;

        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        backface-visibility: hidden;
        user-select: none;
      }

      .wallpaper {
        transform: scale(1.08);
        filter: blur(8px);
      }

      .top-panel-digit {
        font-size: clamp(2rem, 14vw, 8rem);
      }

      .top-panel-digit-sep, .stopwatch-milliseconds {
        font-size: clamp(1.125rem, 7vw, 4.5rem);
      }

      .top-panel-digit.hidden {
        display: none;
      }

      .top-panel-digit.hidden + .top-panel-digit-sep {
        display: none;
      }

      .stopwatch-milliseconds.hidden {
        display: none;
      }
    </style>
  `);

  const { backgroundPosition, backgroundImage } = document.querySelector(".wallpaper").style;

  pipWindow.document.body.insertAdjacentHTML("beforeend", `
    <div class="wallpaper" style='background-position: ${backgroundPosition}; background-image: ${backgroundImage}'></div>
    <div>
      <span class="top-panel-digit${data.hours > 0 ? "" : " hidden"}">${data.hours}</span>
      <span class="top-panel-digit-sep">h</span>
      <span class="top-panel-digit${data.minutes > 0 ? "" : " hidden"}">${data.minutes}</span>
      <span class="top-panel-digit-sep">m</span>
      <span class="top-panel-digit">${data.seconds}</span>
      <span class="top-panel-digit-sep">s</span>
      <span id="milliseconds" class="stopwatch-milliseconds${name === "stopwatch" ? "" : " hidden"}">${data.milliseconds}</span>
    </div>
  `);

  update(data);

  pipWindow.document.body.addEventListener("click", handleClick);
  pipWindow.addEventListener("unload", cleanup, { once: true });
}

function handleClick() {
  timerActions[activeTimer].toggle();
}

async function copyStyleSheets(head) {
  const allCSS = [...document.styleSheets]
    .map(styleSheet => {
      try {
        return [...styleSheet.cssRules].map((r) => r.cssText).join("");
      } catch (e) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.type = styleSheet.type;
        link.media = styleSheet.media;
        link.href = styleSheet.href;
        head.appendChild(link);
        return null;
      }
    })
    .filter(Boolean)
    .join("\n");

  const style = document.createElement("style");
  style.textContent = allCSS;
  head.appendChild(style);
}

function update(name, data) {
  if (!pipWindow || name !== activeTimer) {
    return;
  }
  const [hoursElement, minutesElement, secondsElement] = pipWindow.document.querySelectorAll(".top-panel-digit");

  if (data.hours) {
    hoursElement.classList.remove("hidden");
    hoursElement.textContent = data.hours;
  }
  else {
    hoursElement.classList.add("hidden");
  }

  if (data.minutes) {
    minutesElement.classList.remove("hidden");
    minutesElement.textContent = data.minutes;
  }
  else {
    minutesElement.classList.add("hidden");
  }
  secondsElement.textContent = data.seconds;

  if (activeTimer === "stopwatch") {
    pipWindow.document.getElementById("milliseconds").textContent = data.milliseconds;
  }
}

function updateActions(name, actions) {
  timerActions[name] = actions;
}

export {
  isSupported,
  isActive,
  close,
  toggle,
  update,
  updateActions
};
