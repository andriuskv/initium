import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { dispatchCustomEvent } from "utils";
import { useSettings } from "contexts/settings";
import { handleZIndex } from "services/zIndex";
import * as focusService from "services/focus";
import { useLocalization } from "contexts/localization";
import Icon from "components/Icon";
import "./secondary-panel.css";

const StickyNotes = lazy(() => import("./StickyNotes"));
const Shortcuts = lazy(() => import("./Shortcuts"));
const Calendar = lazy(() => import("./Calendar"));

type Item = {
  id: string,
  title: string,
  iconId: string,
  disabled?: boolean,
  rendered?: boolean,
  visible?: boolean,
  indicatorVisible?: boolean
  attrs?: { [key: string]: string | boolean }
}
type Items = Record<string, Item>;

export default function SecondaryPanel({ corner }: { corner: string }) {
  const locale = useLocalization();
  const { settings } = useSettings();
  const [selectedItem, setSelectedItem] = useState<Item>({ id: "", title: "", iconId: "" });
  const [items, setItems] = useState<Items>(() => getItems());
  const calendarTimeoutId = useRef(0);
  const lastItemId = useRef("");
  const closeButton = useRef<HTMLButtonElement>(null);
  const currentLocale = useRef(locale.locale);

  useEffect(() => {
    if (!items.calendar.rendered && !settings.general.calendarDisabled) {
      clearTimeout(calendarTimeoutId.current);
      calendarTimeoutId.current = window.setTimeout(() => {
        setItems({ ...items, calendar: {...items.calendar, rendered: true } });
      }, 4000);
    }
  }, [items]);

  useEffect(() => {
    function toggleTimersIndicator({ detail }: CustomEventInit) {
      toggleIndicator("timers", detail);
    }

    window.addEventListener("indicator-visibility", toggleTimersIndicator);

    return () => {
      window.removeEventListener("indicator-visibility", toggleTimersIndicator);
    };
  }, [items]);

  useEffect(() => {
    setItems({
      ...items,
      stickyNotes: {
        ...items.stickyNotes,
        disabled: settings.general.stickyNotesDisabled,
        title: locale.secondaryPanel.stickyNotes
      },
      shortcuts: {
        ...items.shortcuts,
        disabled: settings.general.shortcutsDisabled,
        title: locale.secondaryPanel.shortcuts
      },
      timers: {
        ...items.timers,
        disabled: settings.timers.disabled,
        title: locale.secondaryPanel.timers
      },
      calendar: {
        ...items.calendar,
        disabled: settings.general.calendarDisabled,
        title: locale.secondaryPanel.calendar
      },
      settings: {
        ...items.settings,
        title: locale.secondaryPanel.settings
      }
    });
  }, [settings.general, settings.timers]);

  useEffect(() => {
    if (!selectedItem.id) {
      if (lastItemId.current) {
        focusService.focusSelector(`[data-focus-id=${lastItemId.current}]`);
        lastItemId.current = "";
      }
      return;
    }

    if (selectedItem.id === "calendar" && !items.calendar.rendered) {
      clearTimeout(calendarTimeoutId.current);
      setItems({ ...items, calendar: {...items.calendar, rendered: true } });
    }
    else {
      requestAnimationFrame(() => {
        setSelectedItem({ ...selectedItem, visible: true });
      });
    }
  }, [selectedItem.id]);

  useEffect(() => {
    if (selectedItem.visible) {
      setTimeout(() => {
        if (closeButton.current) {
          closeButton.current.focus();
        }
      }, 200 * settings.appearance.animationSpeed);
    }
  }, [selectedItem.visible]);

  useEffect(() => {
    if (selectedItem.id === "calendar" && items.calendar.rendered) {
      setSelectedItem({ ...selectedItem, visible: true });
    }
  }, [items.calendar.rendered]);

  useEffect(() => {
    if (currentLocale.current === locale.locale) {
      return;
    }
    currentLocale.current = locale.locale;
    const newItems: Items = { ...items };

    for (const item in items) {
      newItems[item] = {
        ...items[item],
        title: locale.secondaryPanel[item]
      };
    }
    setItems(newItems);
  }, [items, locale.locale]);

  function getItems() {
    return {
      "stickyNotes": {
        id: "stickyNotes",
        title: locale.secondaryPanel.stickyNotes,
        iconId: "sticky-notes",
        attrs: {
          "data-focus-id": "stickyNotes"
        }
      },
      "shortcuts": {
        id: "shortcuts",
        title: locale.secondaryPanel.shortcuts,
        iconId: "grid",
        attrs: {
          "data-focus-id": "shortcuts"
        }
      },
      "timers": {
        id: "timers",
        title: locale.secondaryPanel.timers,
        iconId: "clock"
      },
      "calendar": {
        id: "calendar",
        title: locale.secondaryPanel.calendar,
        iconId: "calendar",
        attrs: {
          "data-focus-id": "calendar"
        }
      },
      "settings": {
        id: "settings",
        title: locale.global.settings,
        iconId: "settings",
        attrs: {
          "data-modal-initiator": true
        }
      }
    };
  }

  function selectItem(id: string) {
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
      setSelectedItem({ id: "", title: "", iconId: "" });
    }, 400 * settings.appearance.animationSpeed);
  }

  function toggleIndicator(id: string, value: boolean) {
    setItems({ ...items, [id]: { ...items[id], indicatorVisible: value } });
  }

  function selectCalendar() {
    selectItem("calendar");
  }

  return (
    <div className={`secondary-panel ${corner}`} onClick={event => handleZIndex(event, "secondary-panel")}>
      {selectedItem.id ? null : (
        <ul className="secondary-panel-item-selection">
          {Object.values(items).filter(item => !item.disabled).map(item => (
            <li key={item.id}>
              <button className={`btn icon-btn panel-item-btn${item.indicatorVisible ? " indicator" : ""}`}
                onClick={() => selectItem(item.id)} aria-label={item.title} data-tooltip={item.title} {...(item.attrs ? item.attrs : null)}>
                <Icon id={item.iconId} className="panel-item-btn-icon"/>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={`container secondary-panel-item-container${selectedItem.id ? "" : " hidden"}${selectedItem.visible ? " visible" : ""} corner-item`}>
        <div className="container-header secondary-panel-item-header secondary-panel-transition-target">
          <Icon id={selectedItem.iconId}/>
          <h3 className="secondary-panel-item-title">{selectedItem.title}</h3>
          <button className="btn icon-btn" onClick={hideItem} ref={closeButton} title={locale.global.close}>
            <Icon id="cross"/>
          </button>
        </div>
        <div className="secondary-panel-transition-target">
          {selectedItem.id === "stickyNotes" ? (
            <div className={`container-body secondary-panel-item-content${selectedItem.id ? "" : " hidden"}`}
              style={{ width: "280px", height: "312px"}}>
              <Suspense fallback={null}>
                <StickyNotes locale={locale} hide={hideItem}/>
              </Suspense>
            </div>
          ) : selectedItem.id === "shortcuts" ? (
            <div className={`container-body secondary-panel-item-content${selectedItem.id ? "" : " hidden"}`}
              style={{ width: "380px", height: "272px" }}>
              <Suspense fallback={null}>
                <Shortcuts locale={locale}/>
              </Suspense>
            </div>
          ) : null}
          {items.calendar.rendered ? (
            <div className={`secondary-panel-item-content${selectedItem.id === "calendar" ? "" : " hidden"}`}
              style={{ width: "380px", minHeight: "402px"}}>
              <Suspense fallback={null}>
                <Calendar visible={selectedItem.id === "calendar" && !!selectedItem.visible}
                  locale={locale} reveal={selectCalendar} showIndicator={toggleIndicator}/>
              </Suspense>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
