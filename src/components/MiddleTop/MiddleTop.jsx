import { useState, useEffect, useLayoutEffect, useRef, lazy, Suspense } from "react";
import { setPageTitle } from "utils";
import "./middle-top.css";

const TopPanel = lazy(() => import("./TopPanel"));
const Clock = lazy(() => import("./Clock"));
const Greeting = lazy(() => import("./Greeting"));

export default function MiddleTop({ settings, greetingEditorVisible }) {
  const [shouldCenterClock, setShouldCenterClock] = useState(() => getClockCenterState());
  const [greetingVisible, setGreetingVisible] = useState(false);
  const [topPanel, setTopPanel] = useState({ rendered: false, forceVisibility: false });
  const [itemOrder, setItemOrder] = useState({});
  const topPanelTimeoutId = useRef(0);

  useEffect(() => {
    initTopPanel();

    window.addEventListener("top-panel-visible", renderTopPanel, { once: true });
  }, []);

  useEffect(() => {
    if (settings.timers.disabled) {
      setPageTitle();
    }
  }, [settings]);

  useEffect(() => {
    if (greetingEditorVisible) {
      setGreetingVisible(false);
    }
    else {
      initGreeting();
    }
  }, [greetingEditorVisible]);


  useLayoutEffect(() => {
    const alignment = {};

    for (const item of settings.general.middleTopOrder) {
      alignment[`--${item.id}-alignment`] = item.alignment || "center";
    }
    setItemOrder({
      alignment,
      orderString: getOrderString(settings.general.middleTopOrder)
    });
  }, [settings.general.middleTopOrder]);

  useLayoutEffect(() => {
    setShouldCenterClock(getClockCenterState());
  }, [settings.mainPanel, settings.timeDate]);

  function getOrderString(items) {
    return items.reduce((str, item) => `${str} "${item.id}"`, ``).trimStart();
  }

  function getClockCenterState() {
    if (settings.mainPanel.disabled || (settings.mainPanel.navHidden && !localStorage.getItem("mainPanelTab"))) {
      return settings.timeDate.centerClock;
    }
    return false;
  }

  async function initGreeting() {
    if (settings.general.greeting.disabled) {
      return;
    }
    const chromeStorage = await import("services/chromeStorage");
    const greetings = await chromeStorage.get("greetings");

    if (greetings?.length) {
      setGreetingVisible(true);
    }
  }

  async function initTopPanel() {
    if (settings.timers.disabled) {
      return;
    }
    const chromeStorage = await import("services/chromeStorage");
    const countdowns = await chromeStorage.get("countdowns");

    if (countdowns?.length) {
      topPanelTimeoutId.current = setTimeout(() => {
        setTopPanel({ rendered: true });
      }, 4000);
    }
  }

  function resetTopPanel() {
    setTopPanel({ ...topPanel, rendered: true, forceVisibility: false });
  }

  function renderTopPanel({ detail }) {
    const initialTab = detail ? detail.tab : "";

    clearTimeout(topPanelTimeoutId.current);
    setTopPanel({ rendered: true, initialTab, forceVisibility: true });

    if (initialTab) {
      localStorage.setItem("active-timer-tab", initialTab);
    }
  }

  return (
    <div className={`middle-top${shouldCenterClock ? " full-height": ""}${settings.timeDate.clockDisabled ? " clock-disabled" : ""}`}
      style={{ "--order": itemOrder.orderString, ...itemOrder.alignment }}>
      <Suspense fallback={null}>
        {!settings.timers.disabled && topPanel.rendered && <TopPanel initialTab={topPanel.initialTab} forceVisibility={topPanel.forceVisibility} settings={settings.timers} animationSpeed={settings.appearance.animationSpeed} resetTopPanel={resetTopPanel} />}
      </Suspense>
      <Suspense fallback={null}>
        {settings.timeDate.clockDisabled ? null : <Clock settings={settings.timeDate}/>}
      </Suspense>
      <Suspense fallback={null}>
        {greetingVisible && !settings.general.greeting.disabled ? <Greeting settings={settings.general.greeting}/> : null}
      </Suspense>
    </div>
  );
}
