import { useState, useEffect, useLayoutEffect, useRef, lazy, Suspense } from "react";
import { delay, setPageTitle } from "utils";
import { handleZIndex, increaseZIndex } from "services/zIndex";
import { getSetting } from "services/settings";
import { useLocalization } from "contexts/localization";
import TabsContainer from "components/TabsContainer";
import Icon from "components/Icon";
import { removeFromRunning, getLastRunningTimer, isLastRunningTimer } from "./running-timers";
import * as pipService from "./picture-in-picture";
import "./top-panel.css";
import Countdown from "./Countdown";

const Timer = lazy(() => import("./Timer"));
const Stopwatch = lazy(() => import("./Stopwatch"));
const Pomodoro = lazy(() => import("./Pomodoro"));
const World = lazy(() => import("./World"));

export default function TopPanel({ settings, initialTab = "", forceVisibility = false, animationSpeed, resetTopPanel }) {
  const locale = useLocalization();
  const [visible, setVisible] = useState(false);
  const [minimal, setMinimal] = useState(false);
  const [rerender, setRerender] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab || "timer");
  const [expanded, setExpanded] = useState(false);
  const [tabs, setTabs] = useState(() => {
    const tabs = {
      timer: { name: locale.topPanel.timer },
      stopwatch: { name: locale.topPanel.stopwatch },
      pomodoro: { name: locale.topPanel.pomodoro },
      countdown: { name: locale.topPanel.countdown },
      world: { name: locale.topPanel.world }
    };

    if (activeTab) {
      tabs[activeTab].rendered = true;
    }
    return tabs;
  });
  const containerRef = useRef(null);
  const minimalVisible = useRef(false);
  const activeTabIndex = findTabIndex(activeTab);

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
    window.addEventListener("top-panel-visible", toggleTopPanel);

    return () => {
      window.removeEventListener("top-panel-visible", toggleTopPanel);
    };
  }, [visible, minimal, activeTab, tabs]);

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

  function findTabIndex(name) {
    const index = Object.keys(tabs).findIndex(tab => tab === name);

    return index < 0 ? 0 : index;
  }

  function handleReset(name) {
    if (minimalVisible.current) {
      removeFromRunning(name);

      if (getLastRunningTimer()) {
        containerRef.current.classList.replace(name, getLastRunningTimer());
      }
      else {
        resetMinimal();
        return delay(250 * animationSpeed);
      }
    }
  }

  function updateTitle(name, values) {
    if (isLastRunningTimer(name)) {
      if (values) {
        const { hours, minutes, seconds, isAudioEnabled } = values;

        setPageTitle(`${hours ? `${hours} h ` : ""}${minutes ? `${minutes} m ` : ""}${seconds} s${isAudioEnabled ? " \uD83D\uDD14" : ""}`);
      }
      else {
        setPageTitle();
      }
    }
  }

  function toggleTopPanel({ detail }) {
    if (detail && activeTab !== detail.tab) {
      if (minimal) {
        resetMinimal(true);
      }
      else {
        setVisible(true);
      }
      setActiveTab(detail.tab);

      if (!tabs[detail.tab].rendered) {
        tabs[detail.tab].rendered = true;
        setTabs({ ...tabs });
      }
      return;
    }
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

    containerRef.current.classList.add("no-delay");
    containerRef.current.classList.remove("visible");

    setTimeout(() => {
      setMinimal(false);

      if (shouldShowFull) {
        setVisible(true);
      }
      containerRef.current.classList.remove("no-delay");
    }, 200 * animationSpeed);
  }

  function showMinimalTimer() {
    if (pipService.isActive()) {
      return;
    }
    const { showMinimal } = getSetting("timers");

    if (showMinimal && getLastRunningTimer()) {
      minimalVisible.current = true;

      setTimeout(() => {
        setMinimal(true);
      }, 250 * animationSpeed);
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

  function toggleIndicator(name, value) {
    tabs[name].indicatorVisible = value;
    setTabs({ ...tabs });
  }

  function exitFullscreen() {
    setExpanded(false);
  }

  function expand() {
    setFullscreenTextScale();
    setExpanded(true);

    if (pipService.isActive()) {
      pipService.close();
    }
  }

  function collapse(event) {
    if (event.key === "Escape") {
      exitFullscreen();
    }
  }

  return (
    <div className={`top-panel${minimal ? ` minimal visible` : expanded ? " fullscreen-mask expanded" : " container"}${visible ? " visible" : ""}`}
      onClick={event => handleZIndex(event, "top-panel")} ref={containerRef}>
      <div className="top-panel-content">
        <TabsContainer className="top-panel-hide-target" current={activeTabIndex}>
          <ul className="container-header top-panel-header">
            {Object.keys(tabs).map(item => (
              <li className={`top-panel-header-item${activeTab === item ? " active" : ""}`} key={item}>
                <button className="btn icon-text-btn top-panel-header-item-btn" onClick={() => selectTab(item)}>
                  <span className={tabs[item].indicatorVisible ? "indicator" : ""}>
                    <Icon id={item}/>
                  </span>
                  <span>{tabs[item].name}</span>
                </button>
              </li>
            ))}
            <li className="top-panel-close-btn">
              <button className="btn icon-btn" onClick={hideTopPanel} title={locale.global.close}>
                <Icon id="cross"/>
              </button>
            </li>
          </ul>
        </TabsContainer>
        <Suspense fallback={<div className={`top-panel-item-placeholder ${activeTab}`}></div>}>
          {tabs.timer.rendered ? (
            <Timer visible={activeTab === "timer"} locale={locale} toggleIndicator={toggleIndicator} updateTitle={updateTitle}
              expand={expand} exitFullscreen={exitFullscreen} handleReset={handleReset}/>
          ) : null}
          {tabs.stopwatch.rendered ? <Stopwatch visible={activeTab === "stopwatch"} locale={locale} toggleIndicator={toggleIndicator}
            updateTitle={updateTitle} expand={expand}/> : null}
          {tabs.pomodoro.rendered ? (
            <Pomodoro visible={activeTab === "pomodoro"} locale={locale} toggleIndicator={toggleIndicator} updateTitle={updateTitle}
              expand={expand} exitFullscreen={exitFullscreen} handleReset={handleReset}/>
          ) : null}
          {tabs.world.rendered ? <World visible={activeTab === "world"} parentVisible={visible} locale={locale}/> : null}
        </Suspense>
        <Countdown visible={activeTab === "countdown"} locale={locale} toggleIndicator={toggleIndicator}/>
        {expanded && (
          <button className="btn icon-btn top-panel-collapse-btn" onClick={hideTopPanel} title={locale.global.close}>
            <Icon id="cross"/>
          </button>
        )}
      </div>
    </div>
  );
}
