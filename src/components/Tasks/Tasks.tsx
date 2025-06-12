import type { GeneralSettings, TasksSettings } from "types/settings";
import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { handleZIndex } from "services/zIndex";
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
  const [state, setState] = useState({ rendered: false, visible: false, revealed: false, hiding: false });
  const [expanded, setExpanded] = useState(false);
  const timeoutId = useRef(0);

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
    if (!state.rendered) {
      setState({ ...state, rendered: true, visible: false });
    }
    else {
      setState({ ...state, visible: !state.visible, hiding: state.visible });
    }
  }

  function toggleSize() {
    setExpanded(!expanded);
  }

  return (
    <div className={`tasks${expanded ? " expanded" : ""}${state.revealed ? " revealed" : ""} ${corner}`}
      onClick={event => handleZIndex(event, "tasks")}>
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
