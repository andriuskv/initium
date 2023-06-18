import { useState, useEffect, useLayoutEffect, useRef, lazy, Suspense } from "react";
import "./middle-top.css";

const TopPanel = lazy(() => import("./TopPanel"));
const Clock = lazy(() => import("./Clock"));
const Greeting = lazy(() => import("./Greeting"));

export default function MiddleTop({ settings, greetingEditorVisible }) {
  const [shouldCenterClock, setShouldCenterClock] = useState(() => getClockCenterState());
  const [greeting, setGreeting] = useState(null);
  const [topPanel, setTopPanel] = useState({ rendered: false, forceVisibility: false });
  const topPanelTimeoutId = useRef(0);

  useEffect(() => {
    initGreeting();
    initTopPanel();

    window.addEventListener("top-panel-visible", renderTopPanel, { once: true });
  }, []);

  useLayoutEffect(() => {
    setShouldCenterClock(getClockCenterState());
  }, [settings.mainPanel, settings.timeDate]);

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
    if (settings.general.timersDisabled) {
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

  function renderTopPanel() {
    clearTimeout(topPanelTimeoutId.current);
    setTopPanel({ rendered: true, forceVisibility: true });
  }

  return (
    <div className={`middle-top${shouldCenterClock ? " full-height": ""}${settings.timeDate.clockDisabled ? " clock-disabled" : ""}`}>
      <Suspense fallback={null}>
        {!settings.general.timersDisabled && topPanel.rendered && <TopPanel forceVisibility={topPanel.forceVisibility}/>}
      </Suspense>
      <Suspense fallback={null}>
        {settings.timeDate.clockDisabled ? null : <Clock settings={settings.timeDate}/>}
      </Suspense>
      <Suspense fallback={null}>
        {settings.general.greetingDisabled || !greeting || greetingEditorVisible ? null : (
          <Greeting settings={settings.greeting}/>
        )}
      </Suspense>
    </div>
  );
}
