import type { TabName } from "./TopPanel/top-panel-types";
import type { Settings } from "types/settings";
import { useState, useEffect, useLayoutEffect, useRef, lazy, Suspense, type CSSProperties } from "react";
import { setPageTitle } from "utils";
import * as chromeStorage from "services/chromeStorage";
import { getWidgetState, setWidgetState } from "services/widgetStates";
import "./middle-top.css";

const TopPanel = lazy(() => import("./TopPanel"));
const Clock = lazy(() => import("./Clock"));
const Greeting = lazy(() => import("./Greeting"));

type Props = {
  settings: Settings
}

type TopPanelState = {
  rendered: boolean
  forceVisibility?: boolean
  initialTab?: TabName
  initialVisibility?: boolean
}

export default function MiddleTop({ settings }: Props) {
  const [shouldCenterClock, setShouldCenterClock] = useState(() => getClockCenterState());
  const [greetingVisible, setGreetingVisible] = useState(false);
  const [topPanel, setTopPanel] = useState<TopPanelState>(() => {
    if (settings.general.rememberWidgetState) {
      const state = getWidgetState("topPanel");
      return { rendered: state, initialVisibility: state };
    }
    return { rendered: false };
  });
  const [itemOrder, setItemOrder] = useState(() => getItemOrder());
  const topPanelTimeoutId = useRef(0);

  useEffect(() => {
    initTopPanel();
    initGreeting();

    window.addEventListener("top-panel-visible", renderTopPanel, { once: true });
  }, []);

  useEffect(() => {
    if (settings.timers.disabled) {
      setPageTitle();
    }
  }, [settings]);

  useLayoutEffect(() => {
    setItemOrder(getItemOrder());
  }, [settings.general.middleTopOrder]);

  useLayoutEffect(() => {
    setShouldCenterClock(getClockCenterState());
  }, [settings.mainPanel, settings.timeDate]);

  function getItemOrder() {
    const order: Record<string, string> = {};

    for (const item of settings.general.middleTopOrder) {
      order[`--${item.id}-alignment`] = item.alignment || "center";
    }
    return {
      order,
      orderString: getOrderString(settings.general.middleTopOrder)
    };
  }

  function getOrderString(items: Settings["general"]["middleTopOrder"]) {
    return items.reduce((str, item) => `${str} "${item.id}"`, ``).trimStart();
  }

  function getClockCenterState() {
    if (settings.mainPanel.disabled || (settings.mainPanel.navHidden && !localStorage.getItem("mainPanelTab"))) {
      return settings.timeDate.centerClock;
    }
    return false;
  }

  async function initGreeting() {
    const greetings = await chromeStorage.get("greetings");

    if (greetings?.length) {
      setGreetingVisible(true);
      return;
    }
    chromeStorage.subscribeToChanges(({ greetings }) => {
      if (greetings?.newValue) {
        setGreetingVisible(true);
        chromeStorage.removeSubscriber("greeting");
      }
    }, { id: "greeting", listenToLocal: true });
  }

  async function initTopPanel() {
    if (settings.timers.disabled) {
      return;
    }
    const chromeStorage = await import("services/chromeStorage");
    const countdowns = await chromeStorage.get("countdowns");

    if (countdowns?.length) {
      topPanelTimeoutId.current = window.setTimeout(() => {
        setTopPanel({ rendered: true });
      }, 4000);
    }
  }

  function resetTopPanel() {
    setTopPanel({ ...topPanel, rendered: true });
  }

  function renderTopPanel({ detail }: CustomEventInit) {
    const initialTab = detail ? detail.tab : "";

    clearTimeout(topPanelTimeoutId.current);
    setTopPanel({ rendered: true, initialTab, forceVisibility: true });

    if (initialTab) {
      localStorage.setItem("active-timer-tab", initialTab);
    }
    setWidgetState("topPanel", true);
  }

  return (
    <div className={`middle-top${shouldCenterClock ? " full-height": ""}${settings.timeDate.clockDisabled ? " clock-disabled" : ""}`}
      style={{ "--order": itemOrder.orderString, ...itemOrder.order } as CSSProperties}>
      <Suspense fallback={null}>
        {!settings.timers.disabled && topPanel.rendered && (
          <TopPanel initialTab={topPanel.initialTab} initialVisibility={topPanel.initialVisibility} forceVisibility={topPanel.forceVisibility} settings={settings.timers}
            animationSpeed={settings.appearance.animationSpeed} resetTopPanel={resetTopPanel}/>
        )}
      </Suspense>
      <Suspense fallback={null}>
        {settings.timeDate.clockDisabled ? null : <Clock generalLocale={settings.general.locale} settings={settings.timeDate}/>}
      </Suspense>
      <Suspense fallback={null}>
        {greetingVisible && !settings.general.greeting.disabled ? <Greeting settings={settings.general.greeting}/> : null}
      </Suspense>
    </div>
  );
}
