import type { GeneralSettings, TasksSettings } from "types/settings";
import { useState, useEffect, useRef, lazy, Suspense, type CSSProperties } from "react";
import { getWidgetState, setWidgetState, handleZIndex, initElementZindex, increaseElementZindex } from "services/widgetStates";
import { getItemPos } from "services/widget-pos";
import { useLocalization } from "contexts/localization";
import "./tasks.css";

const TasksContent = lazy(() => import("./TasksContent"));

type Props = {
  settings: TasksSettings,
  generalSettings: GeneralSettings,
  corner: string
}

export default function Tasks({ settings, generalSettings, corner }: Props) {
  const locale = useLocalization();
  const [state, setState] = useState(() => {
    if (generalSettings.rememberWidgetState) {
      const { opened } = getWidgetState("tasks");
      return { rendered: opened, visible: opened, revealed: opened, hiding: false };
    }
    return { rendered: false, visible: false, revealed: false, hiding: false };
  });
  const [expanded, setExpanded] = useState(false);
  const timeoutId = useRef(0);
  const pos = getItemPos("tasks");
  const [moved, setMoved] = useState(pos.moved);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initElementZindex(container.current, "tasks");

    function handleMoveInit({ detail: { id, moved } }: CustomEventInit) {
      if (id === "tasks") {
        setMoved(moved);
      }
    }
    window.addEventListener("widget-move-init", handleMoveInit);

    return () => {
      window.removeEventListener("widget-move-init", handleMoveInit);
    };
  }, []);

  useEffect(() => {
    if (state.visible) {
      clearTimeout(timeoutId.current);
      setState({ ...state, revealed: true });
    }
    else {
      timeoutId.current = window.setTimeout(() => {
        setState({ ...state, revealed: false, hiding: false });
      }, 300);
    }
  }, [state.visible, expanded]);

  useEffect(() => {
    if (state.rendered) {
      setState({ ...state, visible: true });
    }
  }, [state.rendered]);

  function toggle() {
    const visible = state.visible;
    const nextVisible = !visible;

    if (!state.rendered) {
      setState({ ...state, rendered: true, visible });
    }
    else {
      setState({ ...state, visible: nextVisible, hiding: state.visible });
    }
    setWidgetState("tasks", { opened: nextVisible });

    if (nextVisible) {
      increaseElementZindex(container.current, "tasks");
    }
  }

  function toggleSize() {
    setExpanded(!expanded);
  }

  return (
    <>
      {moved ? (
        <div className={`tasks ${corner}`}>
          <button className={`btn tasks-toggle-btn`} onClick={toggle}>{locale.tasks.title}</button>
        </div>
      ) : null}
      <div className={`tasks${expanded ? " expanded" : ""}${state.revealed ? " revealed" : ""} ${corner}${moved ? " moved" : ""}`}
        style={{ "--x": `${pos.x}%`, "--y": `${pos.y}%` } as CSSProperties}
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
