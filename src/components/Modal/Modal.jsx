import { useEffect, useRef } from "react";
import * as focusService from "services/focus";
import "./modal.css";

export default function Modal({ children, className, transparent, hiding, hide }) {
  const container = useRef(null);
  const isMounted = useRef(false);
  let element = null;

  useEffect(() => {
    isMounted.current = true;
    focusService.setInitiator(document.activeElement);
    focusService.trapFocus("modal", container.current);

    window.addEventListener("keydown", handleKeydown);

    return () => {
      focusService.focusInitiator("modal");
      focusService.clearFocusTrap("modal");

      window.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  function handlePointerDown(event) {
    if (event.target === event.currentTarget) {
      element = event.target;
    }
  }

  function handlePointerUp(event) {
    if (element === event.currentTarget) {
      hide();
    }
    element = null;
  }

  function handleKeydown(event) {
    if (event.key === "Escape") {
      hide();
    }
  }

  return (
    <div className={`modal-mask${transparent ? " transparent" : ""}${hiding ? " hiding" : ""}`} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
      <div className={`container modal${className ? ` ${className}` : ""}`} ref={container}>{children}</div>
    </div>
  );
}
