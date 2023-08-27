import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { dispatchCustomEvent } from "utils";
import { useSettings } from "contexts/settings";
import { handleZIndex } from "services/zIndex";
import Icon from "components/Icon";
import "./bottom-panel.css";

const StickyNotes = lazy(() => import("./StickyNotes"));
const Shortcuts = lazy(() => import("./Shortcuts"));
const Calendar = lazy(() => import("./Calendar"));

export default function BottomPanel() {
  const { settings } = useSettings();
  const [selectedItem, setSelectedItem] = useState({});
  const [items, setItems] = useState(() => ({
    "stickyNotes": {
      id: "stickyNotes",
      title: "Sticky Notes",
      iconId: "sticky-notes",
      attrs: {
        "data-focus-id": "stickyNotes"
      }
    },
    "shortcuts": {
      id: "shortcuts",
      title: "Shortcuts",
      iconId: "grid",
      attrs: {
        "data-focus-id": "shortcuts"
      }
    },
    "timers": {
      id: "timers",
      title: "Timers",
      iconId: "clock"
    },
    "calendar": {
      id: "calendar",
      title: "Calendar",
      iconId: "calendar",
      attrs: {
        "data-focus-id": "calendar"
      }
    },
    "settings": {
      id: "settings",
      title: "Settings",
      iconId: "settings",
      attrs: {
        "data-modal-initiator": true
      }
    }
  }));
  const calendarTimeoutId = useRef(0);
  const lastItemId = useRef("");
  const closeButton = useRef(null);

  useEffect(() => {
    if (!settings.general.calendarDisabled) {
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
    items.stickyNotes.disabled = settings.general.stickyNotesDisabled;
    items.shortcuts.disabled = settings.general.shortcutsDisabled;
    items.timers.disabled = settings.timers.disabled;
    items.calendar.disabled = settings.general.calendarDisabled;

    setItems({ ...items });
  }, [settings.general, settings.timers]);

  useEffect(() => {
    if (!selectedItem.id) {
      if (lastItemId.current) {
        const element = document.querySelector(`[data-focus-id=${lastItemId.current}]`);

        if (element) {
          element.focus();
        }
        lastItemId.current = "";
      }
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
    if (selectedItem.visible && closeButton.current) {
      setTimeout(() => {
        closeButton.current.focus();
      }, 200 * settings.appearance.animationSpeed);
    }
  }, [selectedItem.visible]);

  useEffect(() => {
    if (selectedItem.id === "calendar" && items.calendar.rendered) {
      setSelectedItem({ ...selectedItem, visible: true });
    }
  }, [items.calendar.rendered]);

  function selectItem(id) {
    if (id === "timers") {
      dispatchCustomEvent("top-panel-visible");
    }
    else if (id === "settings") {
      dispatchCustomEvent("fullscreen-modal", { id, shouldToggle: true });
    }
    else {
      setSelectedItem(items[id]);
    }
  }

  function hideItem() {
    lastItemId.current = selectedItem.id;
    setSelectedItem({ ...selectedItem, visible: false });

    setTimeout(() => {
      setSelectedItem({});
    }, 400 * settings.appearance.animationSpeed);
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
              onClick={() => selectItem(item.id)} title={item.title} {...(item.attrs ? item.attrs : null)}>
              <Icon id={item.iconId} className="panel-item-btn-icon"/>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  function renderSelectedItem() {
    const props = {};
    let Component = null;

    if (selectedItem.id === "stickyNotes") {
      props.hide = hideItem;
      Component = StickyNotes;
    }
    else if (selectedItem.id === "shortcuts") {
      Component = Shortcuts;
    }

    if (Component) {
      return (
        <div className={`container-body bottom-panel-item-content${selectedItem.id ? "" : " hidden"}`}>
          <Suspense fallback={null}><Component {...props}/></Suspense>
        </div>
      );
    }
  }

  function renderCalendar() {
    if (items.calendar.rendered) {
      return (
        <div className={`bottom-panel-item-content${selectedItem.id === "calendar" ? "" : " hidden"}`}>
          <Suspense fallback={null}>
            <Calendar visible={selectedItem.id === "calendar" && selectedItem.visible} showIndicator={toggleIndicator}/>
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
        <div className="container-header bottom-panel-item-header bottom-panel-transition-target">
          <Icon id={selectedItem.iconId}/>
          <h3 className="bottom-panel-item-title">{selectedItem.title}</h3>
          <button className="btn icon-btn" onClick={hideItem} ref={closeButton} title="Close">
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
