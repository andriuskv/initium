import { useState, useEffect, useLayoutEffect, useRef, lazy, Suspense } from "react";
import { setPageTitle } from "utils";
import "./middle-top.css";

const TopPanel = lazy(() => import("./TopPanel"));
const Clock = lazy(() => import("./Clock"));
const Greeting = lazy(() => import("./Greeting"));

export default function MiddleTop({ settings, greetingEditorVisible }) {
  const [shouldCenterClock, setShouldCenterClock] = useState(() => getClockCenterState());
  const [greeting, setGreeting] = useState(null);
  const [topPanel, setTopPanel] = useState({ rendered: false, forceVisibility: false });
  const [itemOrder, setItemOrder] = useState({});
  const topPanelTimeoutId = useRef(0);

  useEffect(() => {
    initGreeting();
    initTopPanel();

    window.addEventListener("top-panel-visible", renderTopPanel, { once: true });
  }, []);

  useEffect(() => {
    if (settings.timers.disabled) {
      setPageTitle();
    }
  }, [settings]);

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
    const chromeStorage = await import("services/chromeStorage");
    const greetings = await chromeStorage.get("greetings");

    if (greetings?.length) {
      setGreeting({ visible: true });
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
    clearTimeout(topPanelTimeoutId.current);
    setTopPanel({ rendered: true, initialTab: detail ? detail.tab : "", forceVisibility: true });
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
        {settings.general.greeting.disabled || !greeting || greetingEditorVisible ? null : (
          <Greeting settings={settings.general.greeting}/>
        )}
      </Suspense>
    </div>
  );
}
