import { useEffect, useRef } from "react";
import "./fullscreen-modal.css";

export default function FullscreenModal({ children, hide }) {
  const containerRef = useRef(null);
  let element = null;

  useEffect(() => {
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  function handlePointerDown(event) {
    if (event.target.closest(".fullscreen-modal")) {
      element = true;
    }
  }

  function handlePointerUp({ target }) {
    if (element) {
      element = null;
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

  return <div className="container fullscreen-modal" ref={containerRef}>{children}</div>;
}
