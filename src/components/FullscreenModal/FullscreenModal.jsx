import { useEffect, useRef } from "react";
import * as focusService from "services/focus";
import "./fullscreen-modal.css";

export default function FullscreenModal({ children, transparent, hide }) {
  const container = useRef(null);
  let pointerInside = false;

  useEffect(() => {
    focusService.setInitiator(document.activeElement);
    focusService.trapFocus("fullscreen-modal", container.current);

    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      focusService.focusInitiator("fullscreen-modal");
      focusService.clearFocusTrap("fullscreen-modal");

      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  function handlePointerDown(event) {
    if (event.target.closest(".fullscreen-modal")) {
      pointerInside = true;
    }
  }

  function handlePointerUp({ target }) {
    if (pointerInside) {
      pointerInside = false;
    }
    else if (!target.closest("[data-modal-initiator]")) {
      hide();
    }
  }

  function handleKeydown(event) {
    if (event.key === "Escape") {
      hide();
    }
  }

  return <div className={`fullscreen-modal${transparent ? "" : " container"}`} ref={container}>{children}</div>;
}
