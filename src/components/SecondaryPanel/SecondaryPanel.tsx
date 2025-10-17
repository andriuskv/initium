import type { Items } from "./SecondaryPanel.type";
import type { GeneralSettings } from "types/settings";
import { useState, useEffect, useRef, lazy, Suspense, type CSSProperties } from "react";
import { dispatchCustomEvent } from "utils";
import { useSettings } from "contexts/settings";
import { getSetting } from "services/settings";
import { handleZIndex, initElementZindex, increaseElementZindex, getWidgetState, setWidgetState, handleMoveInit } from "services/widgetStates";
import * as focusService from "services/focus";
import { useLocalization } from "contexts/localization";
import Icon from "components/Icon";
import "./secondary-panel.css";
import Container from "./Container";

const StickyNotes = lazy(() => import("./StickyNotes"));
const Shortcuts = lazy(() => import("./Shortcuts"));
const Calendar = lazy(() => import("./Calendar"));

export default function SecondaryPanel({ corner }: { corner: string }) {
  const locale = useLocalization();
  const { settings } = useSettings();
  const [items, setItems] = useState<Items>(() => getItems());
  const calendarTimeoutId = useRef(0);
  const currentLocale = useRef(locale.locale);
  const container = useRef<HTMLDivElement>(null);
  const firstCalendarReveal = useRef(true);

  useEffect(() => {
    initElementZindex(container.current, "secondaryPanel");

    for (const id of ["stickyNotes", "shortcuts", "calendar"]) {
      if (items[id].moved) {
        const element = document.querySelector(`[data-move-target="${id}"]`) as HTMLElement;
        initElementZindex(element, id);
      }
    }
  }, []);

  useEffect(() => {
    if (!items.calendar.rendered && !settings.general.calendarDisabled) {
      clearTimeout(calendarTimeoutId.current);
      calendarTimeoutId.current = window.setTimeout(() => {
        setItems({ ...items, calendar: {...items.calendar, rendered: true } });
      }, 4000);
    }

    function toggleTimersIndicator({ detail }: CustomEventInit) {
      toggleIndicator("timers", detail);
    }

    function handleMoveInit({ detail: moveItems }: CustomEventInit) {
      const newItems: Items = {};

      for (const id of Object.keys(moveItems)) {
        if (items[id]) {
          newItems[id] = { ...items[id], ...moveItems[id] };
        }
      }

      if (Object.keys(newItems).length) {
        setItems({ ...items, ...newItems });
      }
    }
    window.addEventListener("widget-move-init", handleMoveInit);
    window.addEventListener("indicator-visibility", toggleTimersIndicator);

    return () => {
      window.removeEventListener("widget-move-init", handleMoveInit);
      window.removeEventListener("indicator-visibility", toggleTimersIndicator);
    };
  }, [items]);

  useEffect(() => {
    if (items.calendar.revealed) {
      requestAnimationFrame(() => {
        setItems({ ...items, calendar: { ...items.calendar, visible: true } });

        if (firstCalendarReveal.current && items.calendar.moved) {
          const element = document.querySelector(`[data-move-target="calendar"]`) as HTMLElement;
          firstCalendarReveal.current = false;
          increaseElementZindex(element, "calendar");
        }
      });
    }
  }, [items.calendar.revealed]);

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
    const items: Items = {
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

    const { rememberWidgetState } = getSetting("general") as GeneralSettings;

    for (const id of ["stickyNotes", "shortcuts", "calendar"]) {
      const state = getWidgetState(id);
      items[id] = { ...items[id], ...state };

      if (state.opened && rememberWidgetState) {
        items[id] = { ...items[id], visible: true, revealed: true, rendered: true };
      }
    }
    return items;
  }

  function selectItem(id: string) {
    if (id === "timers") {
      dispatchCustomEvent("top-panel-visible");
    }
    else if (id === "settings") {
      dispatchCustomEvent("fullscreen-modal", { id, shouldToggle: true });
    }
    else {
      if (items[id].visible) {
        hideItem(id);
        return;
      }

      if (!items[id].moved) {
        increaseElementZindex(container.current, "secondaryPanel");
      }

      if (id === "calendar" && !items[id].rendered) {
        clearTimeout(calendarTimeoutId.current);
        setItems({ ...items, [id]: { ...items[id], rendered: true, revealed: true } });
      }
      else {
        setItems({ ...items, [id]: { ...items[id], revealed: true } });

        requestAnimationFrame(() => requestAnimationFrame(() => {
          setItems({ ...items, [id]: { ...items[id], revealed: true, visible: true } });

          if (items[id].moved) {
            const element = document.querySelector(`[data-move-target="${id}"]`) as HTMLElement;

            increaseElementZindex(element, id);
          }
        }));
      }
      setWidgetState(id, { opened: true });
      setTimeout(() => {
        focusService.focusSelector(`[data-comp-focus-id=${id}]`);
      }, 200 * settings.appearance.animationSpeed);
    }
  }

  function hideItem(id: string) {
    setItems({ ...items, [id]: { ...items[id], visible: false } });
    setWidgetState(id, { opened: false });

    setTimeout(() => {
      setItems({ ...items, [id]: { ...items[id], visible: false, revealed: false } });
      focusService.focusSelector(`[data-focus-id=${id}]`);
    }, 200 * settings.appearance.animationSpeed);
  }

  function toggleIndicator(id: string, value: boolean) {
    setItems({ ...items, [id]: { ...items[id], indicatorVisible: value } });
  }

  function selectCalendar() {
    selectItem("calendar");
  }

  function hideStickyNotes() {
    hideItem("stickyNotes");
  }

  return (
    <>
      {items.stickyNotes.moved && items.stickyNotes.revealed ? (
        <div className={`secondary-panel${items.stickyNotes.moved ? " moved" : ""}`} onClick={event => handleZIndex(event, "stickyNotes")} style={{ "--x": `${items.stickyNotes.x}%`, "--y": `${items.stickyNotes.y}%` } as CSSProperties} data-move-target="stickyNotes">
          <Container item={items.stickyNotes} locale={locale} style={{ width: "280px", height: "312px"}}
            handleMoveInit={handleMoveInit} hide={hideStickyNotes}>
            <Suspense fallback={null}>
              <StickyNotes locale={locale} hide={hideStickyNotes}/>
            </Suspense>
          </Container>
        </div>
      ) : null}
      {items.shortcuts.moved && items.shortcuts.revealed ? (
        <div className={`secondary-panel${items.shortcuts.moved ? " moved" : ""}`} onClick={event => handleZIndex(event, "shortcuts")} style={{ "--x": `${items.shortcuts.x}%`, "--y": `${items.shortcuts.y}%` } as CSSProperties} data-move-target="shortcuts">
          <Container item={items.shortcuts} locale={locale} style={{ width: "380px", height: "272px"}}
            handleMoveInit={handleMoveInit} hide={() => hideItem("shortcuts")}>
            <Suspense fallback={null}>
              <Shortcuts locale={locale}/>
            </Suspense>
          </Container>
        </div>
      ) : null}
      {items.calendar.moved && items.calendar.rendered ? (
        <div className={`secondary-panel${items.calendar.moved ? " moved" : ""}`} onClick={event => handleZIndex(event, "calendar")}
          style={{ "--x": `${items.calendar.x}%`, "--y": `${items.calendar.y}%` } as CSSProperties} data-move-target="calendar">
          <Container item={items.calendar} locale={locale} style={{ width: "380px", minHeight: "402px"}} className={` calendar-container${items.calendar.revealed ? " revealed" : ""}`}
            handleMoveInit={handleMoveInit} hide={() => hideItem("calendar")}>
            <Suspense fallback={null}>
              <Calendar visible={!!items.calendar.visible} locale={locale} reveal={selectCalendar} showIndicator={toggleIndicator}/>
            </Suspense>
          </Container>
        </div>
      ) : null}
      <div className={`secondary-panel ${corner}`} onClick={event => handleZIndex(event, "secondaryPanel")} ref={container}>
        {!items.stickyNotes.moved && items.stickyNotes.revealed ? (
          <Container item={items.stickyNotes} locale={locale} style={{ width: "280px", height: "312px"}}
            handleMoveInit={handleMoveInit} hide={hideStickyNotes}>
            <Suspense fallback={null}>
              <StickyNotes locale={locale} hide={hideStickyNotes}/>
            </Suspense>
          </Container>
        ) : null}
        {!items.shortcuts.moved && items.shortcuts.revealed ? (
          <Container item={items.shortcuts} locale={locale} style={{ width: "380px", height: "272px"}}
            handleMoveInit={handleMoveInit} hide={() => hideItem("shortcuts")}>
            <Suspense fallback={null}>
              <Shortcuts locale={locale}/>
            </Suspense>
          </Container>
        ) : null}
        {!items.calendar.moved && items.calendar.rendered ? (
          <Container item={items.calendar} locale={locale} style={{ width: "380px", minHeight: "402px"}} className={` calendar-container${items.calendar.revealed ? " revealed" : ""}`}
            handleMoveInit={handleMoveInit} hide={() => hideItem("calendar")}>
            <Suspense fallback={null}>
              <Calendar visible={!!items.calendar.visible} locale={locale} reveal={selectCalendar} showIndicator={toggleIndicator}/>
            </Suspense>
          </Container>
        ) : null}
      </div>
      <ul className={`secondary-panel-item-selection ${corner}`}>
        {Object.values(items).filter(item => !item.disabled).map(item => (
          <li key={item.id}>
            <button className={`btn icon-btn panel-item-btn${item.indicatorVisible ? " indicator" : ""}`}
              onClick={() => selectItem(item.id)} aria-label={item.title} data-tooltip={item.title} {...(item.attrs ? item.attrs : null)}>
              <Icon id={item.iconId} className="panel-item-btn-icon"/>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
