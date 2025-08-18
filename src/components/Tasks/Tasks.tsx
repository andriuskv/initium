import type { GeneralSettings, TasksSettings } from "types/settings";
import { useState, useEffect, useRef, lazy, Suspense, type CSSProperties } from "react";
import { getWidgetState, setWidgetState, handleZIndex, increaseZIndex } from "services/widgetStates";
import { getItemPos } from "services/widget-pos";
import { useLocalization } from "contexts/localization";
import "./tasks.css";

const TasksContent = lazy(() => import("./TasksContent"));

type Props = {
  settings: TasksSettings,
  generalSettings: GeneralSettings,
  corner: string,
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

  useEffect(() => {
    if (state.visible) {
      clearTimeout(timeoutId.current);
      setState({ ...state, revealed: true });
    }
    else {
      timeoutId.current = window.setTimeout(() => {
        setState({ ...state, revealed: false, hiding: false });
      }, 320);
    }
  }, [state.visible, expanded]);

  useEffect(() => {
    if (state.rendered) {
      setState({ ...state, visible: true });
    }
  }, [state.rendered]);

  function toggle() {
    const visible = state.visible;

    if (!state.rendered) {
      setState({ ...state, rendered: true, visible });
    }
    else {
      setState({ ...state, visible: !visible, hiding: state.visible });
    }
    setWidgetState("tasks", { opened: !visible });
  }

  function toggleSize() {
    setExpanded(!expanded);
  }

  return (
    <div className={`tasks${expanded ? " expanded" : ""}${state.revealed ? " revealed" : ""} ${corner}${pos.moved ? " moved" : ""}`} style={{ "--x": `${pos.x}%`, "--y": `${pos.y}%`, "--z-index": increaseZIndex("tasks") } as CSSProperties}
      onClick={event => handleZIndex(event, "tasks")} data-move-target="tasks">
      <button className={`btn tasks-toggle-btn${state.visible ? " shifted" : ""}${state.hiding ? " hiding" : ""}`} onClick={toggle}>{locale.tasks.title}</button>
      <div className={`container tasks-container${state.visible ? " visible" : ""} corner-item`}>
        <div className="tasks-transition-target tasks-content">
          <Suspense fallback={null}>
            {state.rendered && <TasksContent settings={settings} generalSettings={generalSettings} expanded={expanded} locale={locale} toggleSize={toggleSize}/>}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
