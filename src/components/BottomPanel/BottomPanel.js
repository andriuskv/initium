import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { dispatchCustomEvent } from "utils";
import { handleZIndex } from "services/zIndex";
import Icon from "../Icon";
import "./bottom-panel.css";

const GoogleApps = lazy(() => import("./GoogleApps"));
const Settings = lazy(() => import("./Settings"));
const Calendar = lazy(() => import("./Calendar"));

export default function BottomPanel() {
  const [selectedItem, setSelectedItem] = useState({});
  const [items, setItems] = useState(() => ({
    "google-apps": {
      id: "google-apps",
      title: "Google Apps",
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
    calendarTimeoutId.current = setTimeout(() => {
      items.calendar.rendered = true;
      setItems({ ...items });
    }, 4000);

    window.addEventListener("indicator-visibility", toggleTimersIndicator);

    return () => {
      window.removeEventListener("indicator-visibility", toggleTimersIndicator);
    };
  }, []);

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
        {Object.values(items).map(item => (
          <li className="bottom-panel-item" key={item.id}>
            <button className={`btn icon-btn panel-item-btn${item.indicatorVisible ? " indicator" : ""}`}
              onClick={() => selectItem(item.id)} title={item.title}>
              <Icon id={item.iconId}/>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  function renderSelectedItem() {
    let Component = null;

    if (selectedItem.id === "google-apps") {
      Component = GoogleApps;
    }
    else if (selectedItem.id === "settings") {
      Component = Settings;
    }

    if (Component) {
      return (
        <div className={`bottom-panel-item-content${selectedItem.id ? "" : " hidden"}`}>
          <Suspense fallback={null}><Component/></Suspense>
        </div>
      );
    }
  }

  function renderCalendar() {
    if (items.calendar.rendered) {
      return (
        <div className={`bottom-panel-item-content${selectedItem.id === "calendar" ? "" : " hidden"}`}>
          <Suspense fallback={null}>
            <Calendar showIndicator={toggleIndicator}/>
          </Suspense>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="bottom-panel" onClick={handleZIndex}>
      {selectedItem.id ? null : renderItems()}
      <div className={`container bottom-panel-item-container${selectedItem.id ? "" : " hidden"}${selectedItem.visible ? " visible" : ""}`}>
        <div className="bottom-panel-item-header bottom-panel-transition-target">
          <Icon id={selectedItem.iconId}/>
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
