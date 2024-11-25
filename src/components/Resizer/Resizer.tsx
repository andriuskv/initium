import { PointerEvent as ReactPointerEvent, useLayoutEffect, useRef } from "react";
import "./resizer.css";

type Props = {
  saveHeight: (height: number) => void
}

export default function Resizer({ saveHeight }: Props) {
  const resizerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement>();
  const startY = useRef(0);
  const initialHeight = useRef(320);
  const height = useRef(0);

  useLayoutEffect(() => {
    if (!resizerRef.current) {
      return;
    }
    containerRef.current = resizerRef.current.parentElement!;
    containerRef.current.classList.add("resizing");
    document.body.style.touchAction = "none";

    return () => {
      containerRef.current!.classList.remove("resizing");
      document.body.style.touchAction = "";
    };
  }, []);

  function handlePointerDown({ clientY }: ReactPointerEvent<HTMLDivElement>) {
    startY.current = clientY;
    initialHeight.current = containerRef.current!.offsetHeight;
    document.body.style.userSelect = "none";

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  }

  function handlePointerMove({ clientY }: PointerEvent) {
    height.current = clientY - startY.current + initialHeight.current;

    if (height.current < 360) {
      height.current = 360;
    }
    containerRef.current!.style.setProperty("--height", `${height.current}px`);
  }

  function handlePointerUp() {
    const maxHeight = window.innerHeight - 16;

    if (height.current > maxHeight) {
      height.current = maxHeight;
      containerRef.current!.style.setProperty("--height", `${height.current}px`);
    }
    saveHeight(height.current);
    document.body.style.userSelect = "";
    window.removeEventListener("pointermove", handlePointerMove);
  }

  return <div className="resizer" ref={resizerRef} onPointerDown={handlePointerDown}></div>;
}
