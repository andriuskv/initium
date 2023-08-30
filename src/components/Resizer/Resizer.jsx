import { useLayoutEffect, useRef } from "react";
import "./resizer.css";

export default function Resizer({ container, saveHeight }) {
  const resizerRef = useRef(null);
  const containerRef = useRef(null);
  const startY = useRef(0);
  const initialHeight = useRef(320);
  const height = useRef(0);

  useLayoutEffect(() => {
    containerRef.current = container || resizerRef.current.parentElement;
    containerRef.current.classList.add("resizing");
    document.body.style.touchAction = "none";
    resizerRef.current.addEventListener("pointerdown", handlePointerDown);

    return () => {
      containerRef.current.classList.remove("resizing");
      document.body.style.touchAction = "";
      resizerRef.current.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  function handlePointerDown({ clientY }) {
    startY.current = clientY;
    initialHeight.current = containerRef.current.offsetHeight;
    document.body.style.userSelect = "none";

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  }

  function handlePointerMove({ clientY }) {
    height.current = clientY - startY.current + initialHeight.current;

    if (height.current < 360) {
      height.current = 360;
    }
    containerRef.current.style.setProperty("--height", `${height.current}px`);
  }

  function handlePointerUp() {
    const maxHeight = window.innerHeight - 16;

    if (height.current > maxHeight) {
      height.current = maxHeight;
      containerRef.current.style.setProperty("--height", `${height.current}px`);
    }
    saveHeight(height.current);
    document.body.style.userSelect = "";
    window.removeEventListener("pointermove", handlePointerMove);
  }

  return <div className="resizer" ref={resizerRef}></div>;
}
