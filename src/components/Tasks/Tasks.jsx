import { useState, useEffect, useRef, lazy, Suspense, useLayoutEffect } from "react";
import { handleZIndex } from "services/zIndex";
import { getSetting } from "services/settings";
import "./tasks.css";

const TasksContent = lazy(() => import("./TasksContent"));

export default function Tasks() {
  const [{ visible, rendered }, setState] = useState({ visible: false, rendered: false });
  const containerRef = useRef(null);
  const timeoutId = useRef(0);

  useLayoutEffect(() => {
    const { height } = getSetting("tasks");

    if (height) {
      containerRef.current.style.setProperty("--height", `${height}px`);
    }
  }, []);

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
  }, [visible]);

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

  return (
    <div className="tasks" onClick={event => handleZIndex(event, "tasks")} ref={containerRef}>
      <button className={`btn tasks-toggle-btn${visible ? " shifted" : ""}`} onClick={toggle}>Tasks</button>
      <div className={`container tasks-content${visible ? " visible" : ""}`}>
        <div className="tasks-transition-target">
          <Suspense fallback={null}>
            {rendered && <TasksContent/>}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
