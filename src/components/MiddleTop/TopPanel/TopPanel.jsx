import { useState, useEffect, useLayoutEffect, useRef, lazy, Suspense } from "react";
import { delay, setPageTitle, timeout, toggleBehindElements } from "utils";
import { handleZIndex, increaseZIndex } from "services/zIndex";
import { getSetting } from "services/settings";
import { useLocalization } from "contexts/localization";
import TabsContainer from "components/TabsContainer";
import Icon from "components/Icon";
import { isLastRunningTimer, isRunning, resetRunningTimers } from "./running-timers";
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
  const [activeTab, setActiveTab] = useState(() => {
    return initialTab || (localStorage.getItem("active-timer-tab") || "timer");
  });
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
  const saveTabTimeoutId = useRef(0);
  const activeTabIndex = findTabIndex(activeTab);

  useEffect(() => {
    if (forceVisibility) {
      increaseContainerZIndex();
      setVisible(true);
      resetTopPanel();
    }

    return () => {
      resetRunningTimers();
    };
  }, []);

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
    toggleBehindElements(!expanded, "top-panel");

    return () => {
      window.removeEventListener("keydown", collapse);
    };
  }, [expanded]);

  useEffect(() => {
    function handleClose() {
      if (!visible) {
        setVisible(true);
      }
    }

    window.addEventListener("pip-close", handleClose);

    return () => {
      window.removeEventListener("pip-close", handleClose);
    };
  }, [visible]);

  useLayoutEffect(() => {
    if (!isRunning(activeTab)) {
      return;
    }

    if (minimal) {
      containerRef.current.classList.add(activeTab);
    }
    else if (activeTab) {
      containerRef.current.classList.remove("minimal");
      containerRef.current.classList.remove(activeTab);
    }
  }, [minimal]);

  function getAnimDirection(current, prev) {
    const tabsArr = Object.keys(tabs);

    if (!prev) {
      return null;
    }

    if (tabsArr.indexOf(current) > tabsArr.indexOf(prev)) {
      return { [current]: "anim-right", [prev]: "anim-left" };
    }
    return { [current]: "anim-left", [prev]: "anim-right" };
  }

  function findTabIndex(name) {
    const index = Object.keys(tabs).findIndex(tab => tab === name);

    return index < 0 ? 0 : index;
  }

  function handleReset(name) {
    if (minimalVisible.current && isRunning(name) && activeTab === name) {
      resetMinimal();
      return delay(250 * animationSpeed);
    }
  }

  function updateTitle(name, values) {
    if (!isLastRunningTimer(name)) {
      return;
    }

    if (values) {
      const { hours, minutes, seconds, isAudioEnabled } = values;

      setPageTitle(`${hours ? `${hours} h ` : ""}${minutes ? `${minutes} m ` : ""}${seconds} s${isAudioEnabled ? " \uD83D\uDD14" : ""}`);
    }
    else {
      setPageTitle();
    }
  }

  function toggleTopPanel({ detail }) {
    if (detail && activeTab !== detail.tab) {
      if (minimal) {
        resetMinimal(true);
      }
      else {
        increaseContainerZIndex();
        setVisible(true);
      }
      selectTab(detail.tab);
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
    if (pipService.isActive() || tabs[activeTab].ignore) {
      return;
    }
    const { showMinimal } = getSetting("timers");

    if (showMinimal && isRunning(activeTab)) {
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
    const animTabs = getAnimDirection(name, activeTab);

    if (animTabs) {
      tabs[name].direction = animTabs[name];

      setActiveTab(name);
      setTabs({ ...tabs });
      setTimeout(() => {
        delete tabs[name].direction;
        setTabs({ ...tabs });
      }, 200 * animationSpeed);
    }
    else {
      setActiveTab(name);
    }

    saveTabTimeoutId.current = timeout(() => {
      localStorage.setItem("active-timer-tab", name);
    }, 400, saveTabTimeoutId.current);
  }

  function ignoreMiniTimerPref(tab, value) {
    tabs[tab].ignore = value;
    setTabs({ ...tabs });
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
    document.startViewTransition(() => {
      setExpanded(false);
    });
  }

  function expand() {
    setFullscreenTextScale();
    document.startViewTransition(() => {
      setExpanded(true);
    });

    if (pipService.isActive()) {
      pipService.close();
    }
  }

  function collapse(event) {
    if (event.key === "Escape") {
      exitFullscreen();
    }
  }

  function handleContainerClick(event) {
    if (minimal && event.detail === 2) {
      resetMinimal(true);
    }
    handleZIndex(event, "top-panel");
  }

  return (
    <div className={`top-panel${minimal ? ` minimal visible` : expanded ? " fullscreen-mask expanded" : " container"}${visible ? " visible" : ""}`}
      onClick={handleContainerClick} ref={containerRef}>
      <div className="top-panel-content">
        <TabsContainer className="top-panel-hide-target" visible={visible} current={activeTabIndex}>
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
            <Timer visible={activeTab === "timer"} locale={locale} animDirection={tabs.timer.direction}
              toggleIndicator={toggleIndicator} updateTitle={updateTitle} ignoreMiniTimerPref={ignoreMiniTimerPref}
              expand={expand} exitFullscreen={exitFullscreen} handleReset={handleReset}/>
          ) : null}
          {tabs.stopwatch.rendered ? (
            <Stopwatch visible={activeTab === "stopwatch"} locale={locale} animDirection={tabs.stopwatch.direction}
              toggleIndicator={toggleIndicator} updateTitle={updateTitle} expand={expand}/>
          ) : null}
          {tabs.pomodoro.rendered ? (
            <Pomodoro visible={activeTab === "pomodoro"} locale={locale} animDirection={tabs.pomodoro.direction}
              toggleIndicator={toggleIndicator} updateTitle={updateTitle}
              expand={expand} exitFullscreen={exitFullscreen} handleReset={handleReset}/>
          ) : null}
          {tabs.world.rendered ? (
            <World visible={activeTab === "world"} parentVisible={visible} animDirection={tabs.world.direction}
              locale={locale} />
          ): null}
        </Suspense>
        <Countdown visible={activeTab === "countdown"} locale={locale} toggleIndicator={toggleIndicator} animDirection={tabs.countdown.direction}/>
        {expanded && (
          <button className="btn icon-btn top-panel-collapse-btn" onClick={hideTopPanel} title={locale.global.close}>
            <Icon id="cross"/>
          </button>
        )}
      </div>
    </div>
  );
}
