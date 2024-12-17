import { PointerEvent, PropsWithChildren, useEffect, useRef } from "react";
import * as focusService from "services/focus";
import "./modal.css";

type Props = PropsWithChildren & {
  className?: string,
  transparent?: boolean,
  hiding?: boolean,
  hide: () => void
}

export default function Modal({ children, className, transparent, hiding, hide }: Props) {
  const container = useRef(null);
  const element = useRef(null);

  useEffect(() => {
    if (container.current) {
      focusService.setInitiator(document.activeElement as HTMLElement);
      focusService.trapFocus("modal", container.current);
    }
    window.addEventListener("keydown", handleKeydown);

    return () => {
      focusService.focusInitiator("modal");
      focusService.clearFocusTrap("modal");

      window.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      element.current = event.target as HTMLElement;
    }
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (element.current === event.currentTarget) {
      hide();
    }
    element.current = null;
  }

  function handleKeydown(event: KeyboardEvent) {
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
