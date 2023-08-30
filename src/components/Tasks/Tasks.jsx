import { useState, useEffect, useRef, lazy, Suspense, useLayoutEffect } from "react";
import { handleZIndex } from "services/zIndex";
import "./tasks.css";

const TasksContent = lazy(() => import("./TasksContent"));

export default function Tasks({ settings }) {
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
      timeoutId.current = setTimeout(() => {
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
      setState({ rendered: true });
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
      <button className={`btn tasks-toggle-btn${visible ? " shifted" : ""}`} onClick={toggle}>Tasks</button>
      <div className={`container tasks-container${visible ? " visible" : ""}`}>
        <div className="tasks-transition-target tasks-content">
          <Suspense fallback={null}>
            {rendered && <TasksContent settings={settings} expanded={expanded} toggleSize={toggleSize}/>}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
