import { PropsWithChildren, useLayoutEffect, useRef } from "react";
import * as focusService from "services/focus";
import "./fullscreen-modal.css";

type Props = PropsWithChildren & {
  className?: string,
  transparent?: boolean,
  hiding?: boolean,
  mask?: boolean,
  noAnim?: boolean,
  hide: () => void
}

export default function FullscreenModal({ children, hiding, transparent = false, mask = false, noAnim = false, hide }: Props) {
  const container = useRef(null);
  let pointerInside = false;
  let keep = false;

  useLayoutEffect(() => {
    if (container.current) {
      focusService.setInitiator(document.activeElement as HTMLElement);
      focusService.trapFocus("fullscreen-modal", container.current);
    }

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

  function handlePointerDown({ target }: PointerEvent) {
    keep = false;

    if (target && target instanceof HTMLElement && target.closest(".fullscreen-modal")) {
      pointerInside = true;

      // When date modal is dismissed by clicking outside of it pointer down event is not triggered,
      // to circumvent around that keep an additional variable to check if it's open.
      if (target.closest("[data-modal-keep]")) {
        keep = true;
      }
    }
  }

  function handlePointerUp({ target }) {
    if (pointerInside || keep) {
      pointerInside = false;
    }
    // Selecting an option element with the enter key triggers only a pointerup/click event
    else if (!target.closest("[data-modal-initiator]") && target.nodeName !== "SELECT") {
      hide();
    }
  }

  function handleKeydown({ key }) {
    if (key === "Escape") {
      hide();
    }
  }

  const modal = <div className={`fullscreen-modal${hiding ? " hiding" : ""}${noAnim ? " static" : ""}${transparent ? "" : " container"}`} ref={container}>{children}</div>;

  if (mask) {
    return <div className="fullscreen-modal-mask">{modal}</div>;
  }
  return modal;
}
