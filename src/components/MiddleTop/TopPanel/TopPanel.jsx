import { useState, useEffect, useLayoutEffect, useRef, lazy, Suspense } from "react";
import { delay, setPageTitle } from "utils";
import { handleZIndex, increaseZIndex } from "services/zIndex";
import { getSetting } from "services/settings";
import { removeFromRunning, getLastRunningTimer, isLastRunningTimer } from "./running-timers";
import Icon from "components/Icon";
import "./top-panel.css";
import Countdown from "./Countdown";

const Timer = lazy(() => import("./Timer"));
const Stopwatch = lazy(() => import("./Stopwatch"));
const Pomodoro = lazy(() => import("./Pomodoro"));
const World = lazy(() => import("./World"));

export default function TopPanel({ settings, forceVisibility = false, resetTopPanel }) {
  const [visible, setVisible] = useState(false);
  const [minimal, setMinimal] = useState(false);
  const [rerender, setRerender] = useState(false);
  const [activeTab, setActiveTab] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [tabs, setTabs] = useState(() => ({
    timer: {},
    stopwatch: {},
    pomodoro: {},
    world: {}
  }));
  const containerRef = useRef(null);
  const minimalVisible = useRef(false);

  useEffect(() => {
    if (settings.showMinimal && visible) {
      return;
    }

    if (settings.showMinimal) {
      showMinimalTimer();
    }
    else if (minimalVisible.current) {
      resetMinimal();
    }
  }, [settings.showMinimal]);

  useEffect(() => {
    if (forceVisibility) {
      requestAnimationFrame(() => {
        setRerender(true);
      });
    }
  }, [forceVisibility]);

  useEffect(() => {
    if (rerender) {
      increaseContainerZIndex();
      setVisible(true);
      setRerender(false);
      resetTopPanel();
    }
  }, [rerender]);

  useEffect(() => {
    if (visible && !activeTab) {
      tabs.timer.rendered = true;

      setActiveTab("timer");
      setTabs({ ...tabs });
    }
    window.addEventListener("top-panel-visible", toggleTopPanel);

    return () => {
      window.removeEventListener("top-panel-visible", toggleTopPanel);
    };
  }, [visible, minimal]);

  useEffect(() => {
    if (expanded) {
      window.addEventListener("keydown", collapse);
    }
    else {
      window.removeEventListener("keydown", collapse);
    }
    toggleBehindElements(!expanded);

    return () => {
      window.removeEventListener("keydown", collapse);
    };
  }, [expanded]);

  useLayoutEffect(() => {
    const timer = getLastRunningTimer();

    if (minimal) {
      containerRef.current.classList.add(timer);
    }
    else if (timer) {
      containerRef.current.classList.remove("minimal");
      containerRef.current.classList.remove(timer);
    }
  }, [minimal]);

  function handleReset(name) {
    if (minimalVisible.current) {
      removeFromRunning(name);

      if (getLastRunningTimer()) {
        containerRef.current.classList.replace(name, getLastRunningTimer());
      }
      else {
        resetMinimal();
        return delay(250);
      }
    }
  }

  function updateTitle(name, values) {
    if (isLastRunningTimer(name)) {
      if (values) {
        const { hours, minutes, seconds, isAlarmSet } = values;

        setPageTitle(`${hours ? `${hours} h ` : ""}${minutes ? `${minutes} m ` : ""}${seconds} s${isAlarmSet ? " \uD83D\uDD14" : ""}`);
      }
      else {
        setPageTitle();
      }
    }
  }

  function toggleTopPanel() {
    const nextVisible = !visible;

    if (nextVisible && minimal) {
      resetMinimal(true);
    }
    else {
      setVisible(nextVisible);
    }

    if (nextVisible) {
      increaseContainerZIndex();
    }
    else {
      showMinimalTimer();
    }
  }

  function hideTopPanel() {
    if (expanded) {
      exitFullscreen();
    }
    else {
      setVisible(false);
      showMinimalTimer();
    }
  }

  function toggleBehindElements(shouldShow) {
    const rootElement = document.getElementById("root");
    const parentElement = containerRef.current.parentElement;

    if (shouldShow) {
      for (const element of rootElement.children) {
        element.style.opacity = "";
        element.style.visibility = "";
      }

      for (const element of parentElement.children) {
        element.style.opacity = "";
        element.style.visibility = "";
      }
    }
    else {
      const excludes = ["wallpaper", "wallpaper-video", "middle-top"];

      for (const element of rootElement.children) {
        if (!excludes.some(exclude => element.classList.contains(exclude))) {
          element.style.opacity = "0";
          element.style.visibility = "hidden";
        }
      }

      for (const element of parentElement.children) {
        if (element !== containerRef.current) {
          element.style.opacity = "0";
          element.style.visibility = "hidden";
        }
      }
    }
  }

  function resetMinimal(shouldShowFull = false) {
    minimalVisible.current = false;

    containerRef.current.classList.remove("visible");

    setTimeout(() => {
      setMinimal(false);

      if (shouldShowFull) {
        setVisible(true);
      }
    }, 250);
  }

  function showMinimalTimer() {
    const { showMinimal } = getSetting("timers");

    if (showMinimal && getLastRunningTimer()) {
      minimalVisible.current = true;

      setTimeout(() => {
        setMinimal(true);
      }, 250);
    }
  }

  function selectTab(name) {
    if (!tabs[name].rendered) {
      tabs[name].rendered = true;
      setTabs({ ...tabs });
    }
    setActiveTab(name);
  }

  function setFullscreenTextScale() {
    const { fullscreenTextScale } = getSetting("timers");
    containerRef.current.style.setProperty("--fullscreen-text-scale", fullscreenTextScale);
  }

  function increaseContainerZIndex() {
    containerRef.current.style.setProperty("--z-index", increaseZIndex("top-panel"));
  }

  function exitFullscreen() {
    setExpanded(false);
  }

  function expand() {
    setFullscreenTextScale();
    setExpanded(true);
  }

  function collapse(event) {
    if (event.key === "Escape") {
      exitFullscreen();
    }
  }

  return (
    <div className={`top-panel${minimal ? ` minimal visible` : " container"}${visible ? " visible" : ""}${expanded ? " expanded" : ""}`}
      onClick={event => handleZIndex(event, "top-panel")} ref={containerRef}>
      <div className="top-panel-content">
        <ul className="top-panel-hide-target top-panel-header">
          <li className={`top-panel-header-item${activeTab === "timer" ? " active" : ""}`}>
            <button className="btn icon-text-btn top-panel-header-item-btn" onClick={() => selectTab("timer")}>
              <Icon id="timer"/>
              <span>Timer</span>
            </button>
          </li>
          <li className={`top-panel-header-item${activeTab === "stopwatch" ? " active" : ""}`}>
            <button className="btn icon-text-btn top-panel-header-item-btn" onClick={() => selectTab("stopwatch")}>
              <Icon id="stopwatch"/>
              <span>Stopwatch</span>
            </button>
          </li>
          <li className={`top-panel-header-item${activeTab === "pomodoro" ? " active" : ""}`}>
            <button className="btn icon-text-btn top-panel-header-item-btn" onClick={() => selectTab("pomodoro")}>
              <Icon id="pomodoro"/>
              <span>Pomodoro</span>
            </button>
          </li>
          <li className={`top-panel-header-item${activeTab === "countdown" ? " active" : ""}`}>
            <button className="btn icon-text-btn top-panel-header-item-btn" onClick={() => setActiveTab("countdown")}>
              <Icon id="countdown"/>
              <span>Countdown</span>
            </button>
          </li>
          <li className={`top-panel-header-item${activeTab === "world" ? " active" : ""}`}>
            <button className="btn icon-text-btn top-panel-header-item-btn" onClick={() => selectTab("world")}>
              <Icon id="earth"/>
              <span>World</span>
            </button>
          </li>
          <li className="top-panel-close-btn">
            <button className="btn icon-btn" onClick={hideTopPanel} title="Close">
              <Icon id="cross"/>
            </button>
          </li>
        </ul>
        <Suspense fallback={<div className={`top-panel-item-placeholder ${activeTab}`}></div>}>
          {tabs.timer.rendered ? (
            <Timer visible={activeTab === "timer"} updateTitle={updateTitle}
              expand={expand} exitFullscreen={exitFullscreen} handleReset={handleReset}/>
          ) : null}
          {tabs.stopwatch.rendered ? <Stopwatch visible={activeTab === "stopwatch"} updateTitle={updateTitle} expand={expand}/> : null}
          {tabs.pomodoro.rendered ? (
            <Pomodoro visible={activeTab === "pomodoro"} updateTitle={updateTitle}
              expand={expand} exitFullscreen={exitFullscreen} handleReset={handleReset}/>
          ) : null}
          {tabs.world.rendered ? <World visible={activeTab === "world"} parentVisible={visible}/> : null}
        </Suspense>
        <Countdown visible={activeTab === "countdown"}/>
        {expanded && (
          <button className="btn icon-btn top-panel-collapse-btn" onClick={hideTopPanel} title="Close">
            <Icon id="cross"/>
          </button>
        )}
      </div>
    </div>
  );
}
