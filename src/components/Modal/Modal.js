import { useEffect } from "react";
import "./modal.css";

export default function Modal({ className, children, hide }) {
  let element = null;

  useEffect(() => {
    window.addEventListener("keydown", handleKeydown);

    return () => {
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
    <div className="modal-mask" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
      <div className={`container modal${className ? ` ${className}` : ""}`}>{children}</div>
    </div>
  );
}
