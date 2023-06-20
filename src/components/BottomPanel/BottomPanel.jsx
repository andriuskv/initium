import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { dispatchCustomEvent } from "utils";
import { useSettings } from "contexts/settings";
import { handleZIndex } from "services/zIndex";
import Icon from "components/Icon";
import "./bottom-panel.css";

const Shortcuts = lazy(() => import("./Shortcuts"));
const Settings = lazy(() => import("./Settings"));
const Calendar = lazy(() => import("./Calendar"));

export default function BottomPanel() {
  const { settings: { general: settings } } = useSettings();
  const [selectedItem, setSelectedItem] = useState({});
  const [items, setItems] = useState(() => ({
    "shortcuts": {
      id: "shortcuts",
      title: "Shortcuts",
      iconId: "grid"
    },
    "timers": {
      id: "timers",
      title: "Timers",
      iconId: "clock"
    },
    "calendar": {
      id: "calendar",
      title: "Calendar",
      iconId: "calendar"
    },
    "settings": {
      id: "settings",
      title: "Settings",
      iconId: "settings"
    }
  }));
  const calendarTimeoutId = useRef(0);

  useEffect(() => {
    if (!settings.calendarDisabled) {
      calendarTimeoutId.current = setTimeout(() => {
        items.calendar.rendered = true;
        setItems({ ...items });
      }, 4000);
    }

    window.addEventListener("indicator-visibility", toggleTimersIndicator);

    return () => {
      window.removeEventListener("indicator-visibility", toggleTimersIndicator);
    };
  }, []);

  useEffect(() => {
    items.shortcuts.disabled = settings.shortcutsDisabled;
    items.timers.disabled = settings.timersDisabled;
    items.calendar.disabled = settings.calendarDisabled;

    setItems({ ...items });
  }, [settings]);

  useEffect(() => {
    if (!selectedItem.id) {
      return;
    }

    if (selectedItem.id === "calendar" && !items.calendar.rendered) {
      clearTimeout(calendarTimeoutId.current);
      items.calendar.rendered = true;
      setItems({ ...items });
    }
    else {
      setSelectedItem({ ...selectedItem, visible: true });
    }
  }, [selectedItem.id]);

  useEffect(() => {
    if (selectedItem.id === "calendar" && items.calendar.rendered) {
      setSelectedItem({ ...selectedItem, visible: true });
    }
  }, [items.calendar.rendered]);

  function selectItem(id) {
    if (id === "timers") {
      dispatchCustomEvent("top-panel-visible");
    }
    else {
      setSelectedItem(items[id]);
    }
  }

  function hideItem() {
    setSelectedItem({ ...selectedItem, visible: false });

    setTimeout(() => {
      setSelectedItem({});
    }, 400);
  }

  function toggleIndicator(id, value) {
    items[id].indicatorVisible = value;
    setItems({...items});
  }

  function toggleTimersIndicator({ detail }) {
    toggleIndicator("timers", detail);
  }

  function renderItems() {
    return (
      <ul className="bottom-panel-item-selection">
        {Object.values(items).filter(item => !item.disabled).map(item => (
          <li key={item.id}>
            <button className={`btn icon-btn panel-item-btn${item.indicatorVisible ? " indicator" : ""}`}
              onClick={() => selectItem(item.id)} title={item.title}>
              <Icon id={item.iconId} className="panel-item-btn-icon"/>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  function renderSelectedItem() {
    let Component = null;
    let placeholder = null;

    if (selectedItem.id === "shortcuts") {
      Component = Shortcuts;
      placeholder = <div className="apps-placeholder"></div>;
    }
    else if (selectedItem.id === "settings") {
      Component = Settings;
      placeholder = <div className="settings-placeholder"></div>;
    }

    if (Component) {
      return (
        <div className={`bottom-panel-item-content${selectedItem.id ? "" : " hidden"}`}>
          <Suspense fallback={placeholder}><Component/></Suspense>
        </div>
      );
    }
  }

  function renderCalendar() {
    if (items.calendar.rendered) {
      return (
        <div className={`bottom-panel-item-content${selectedItem.id === "calendar" ? "" : " hidden"}`}>
          <Suspense fallback={<div className="calendar-placeholder"></div>}>
            <Calendar showIndicator={toggleIndicator}/>
          </Suspense>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="bottom-panel" onClick={event => handleZIndex(event, "bottom-panel")}>
      {selectedItem.id ? null : renderItems()}
      <div className={`container bottom-panel-item-container${selectedItem.id ? "" : " hidden"}${selectedItem.visible ? " visible" : ""}`}>
        <div className="bottom-panel-item-header bottom-panel-transition-target">
          <Icon id={selectedItem.iconId} className="bottom-panel-item-icon"/>
          <h3 className="bottom-panel-item-title">{selectedItem.title}</h3>
          <button className="btn icon-btn" onClick={hideItem} title="Close">
            <Icon id="cross"/>
          </button>
        </div>
        <div className="bottom-panel-transition-target">
          {renderSelectedItem()}
          {renderCalendar()}
        </div>
      </div>
    </div>
  );
}
