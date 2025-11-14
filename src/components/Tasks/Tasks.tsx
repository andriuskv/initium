import type { AppearanceSettings, GeneralSettings, TasksSettings } from "types/settings";
import { useState, useEffect, useRef, lazy, Suspense, type CSSProperties } from "react";
import { getWidgetState, setWidgetState, handleZIndex, initElementZindex, increaseElementZindex } from "services/widgetStates";
import { useLocalization } from "contexts/localization";
import "./tasks.css";
import { getSetting } from "services/settings";

const TasksContent = lazy(() => import("./TasksContent"));

type Props = {
  settings: TasksSettings,
  generalSettings: GeneralSettings,
  corner: string
}

export default function Tasks({ settings, generalSettings, corner }: Props) {
  const widgetState = getWidgetState("tasks");
  const locale = useLocalization();
  const [state, setState] = useState(() => {
    if (generalSettings.rememberWidgetState) {
      const { opened } = widgetState;
      return { rendered: opened, visible: opened, revealed: opened, hiding: false };
    }
    return { rendered: false, visible: false, revealed: false, hiding: false };
  });
  const [expanded, setExpanded] = useState(false);
  const [collapsing, setCollapsing] = useState(false);
  const timeoutId = useRef(0);
  const [moved, setMoved] = useState(widgetState.moved);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initElementZindex(container.current, "tasks");

    function handleMoveInit({ detail: { tasks } }: CustomEventInit) {
      if (tasks) {
        setMoved(tasks.moved);
      }
    }
    window.addEventListener("widget-move-init", handleMoveInit);

    return () => {
      window.removeEventListener("widget-move-init", handleMoveInit);
    };
  }, []);

  function toggle() {
    const visible = state.visible;
    const nextVisible = !visible;

    if (!state.rendered) {
      const nextState = { ...state, rendered: true };
      setState(nextState);

      requestAnimationFrame(() => {
        setState({ ...nextState, visible: true });

        requestAnimationFrame(() => {
          setState({ ...nextState, visible: true, revealed: true });
        });
      });
    }
    else {
      const nextState = { ...state, visible: nextVisible, hiding: state.visible };

      clearTimeout(timeoutId.current);
      setState(nextState);

      if (nextVisible) {
        requestAnimationFrame(() => {
          setState({ ...nextState, revealed: true });
        });
      }
      else {
        timeoutId.current = window.setTimeout(() => {
          setState({ ...nextState, revealed: false, hiding: false });
        }, 300);
      }
    }

    setWidgetState("tasks", { opened: nextVisible });

    if (nextVisible) {
      increaseElementZindex(container.current, "tasks");
    }
  }

  function toggleSize() {
    if (expanded) {
      setExpanded(false);
      setCollapsing(true);

      setTimeout(() => {
        setCollapsing(false);
      }, 200 * (getSetting("appearance") as AppearanceSettings).animationSpeed);
    }
    else {
      setExpanded(true);
    }
  }

  return (
    <>
      {moved ? (
        <div className={`tasks placement-${corner}`}>
          <button className={`btn tasks-toggle-btn`} onClick={toggle}>{locale.tasks.title}</button>
        </div>
      ) : null}
      <div className={`tasks${expanded ? " expanded" : ""}${collapsing ? " collapsing" : ""}${state.revealed ? " revealed" : ""} placement-${corner}${moved ? " moved" : ""}`}
        style={{ "--x": `${widgetState.x}%`, "--y": `${widgetState.y}%` } as CSSProperties}
        onClick={event => handleZIndex(event, "tasks")} data-move-target="tasks" ref={container}>
        {moved && !state.visible ? null : (
          <button className={`btn tasks-toggle-btn${state.visible ? " shifted" : ""}${state.hiding ? " hiding" : ""}`}
            onClick={toggle}>{locale.tasks.title}</button>
        )}
        <div className={`container tasks-container${state.visible ? " visible" : ""} corner-item`}>
          <div className="tasks-transition-target tasks-content">
            <Suspense fallback={null}>
              {state.rendered && <TasksContent settings={settings} generalSettings={generalSettings} expanded={expanded} locale={locale} toggleSize={toggleSize}/>}
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
