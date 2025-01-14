import { useState, useEffect, useRef, lazy, Suspense, useLayoutEffect } from "react";
import { handleZIndex } from "services/zIndex";
import "./tasks.css";
import type { GeneralSettings, TasksSettings } from "types/settings";

const TasksContent = lazy(() => import("./TasksContent"));

type Props = {
  settings: TasksSettings,
  generalSettings: GeneralSettings,
  locale: any
}

export default function Tasks({ settings, generalSettings, locale }: Props) {
  const [{ visible, rendered }, setState] = useState({ visible: false, rendered: false });
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef(null);
  const timeoutId = useRef(0);

  useLayoutEffect(() => {
    if (visible) {
      clearTimeout(timeoutId.current);
      containerRef.current.classList.add("revealed");
    }
    else {
      timeoutId.current = window.setTimeout(() => {
        containerRef.current.classList.remove("revealed");
      }, 320);
    }
  }, [visible, expanded]);

  useEffect(() => {
    if (rendered) {
      setState({ rendered, visible: true });
    }
  }, [rendered]);

  function toggle() {
    if (!rendered) {
      setState({ rendered: true, visible: false });
    }
    else {
      setState({ rendered, visible: !visible });
    }
  }

  function toggleSize() {
    setExpanded(!expanded);
  }

  return (
    <div className={`tasks${expanded ? " expanded" : ""}`} onClick={event => handleZIndex(event, "tasks")} ref={containerRef}>
      <button className={`btn tasks-toggle-btn${visible ? " shifted" : ""}`} onClick={toggle}>{locale.tasks.title}</button>
      <div className={`container tasks-container${visible ? " visible" : ""}`}>
        <div className="tasks-transition-target tasks-content">
          <Suspense fallback={null}>
            {rendered && <TasksContent settings={settings} generalSettings={generalSettings} expanded={expanded} locale={locale} toggleSize={toggleSize}/>}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
