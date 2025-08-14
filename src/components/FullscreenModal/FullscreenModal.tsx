import type { PropsWithChildren } from "react";
import { useEffect, useLayoutEffect, useRef } from "react";
import * as focusService from "services/focus";
import { handleZIndex, increaseZIndex } from "services/zIndex";
import "./fullscreen-modal.css";

type Props = PropsWithChildren & {
  className?: string,
  transparent?: boolean,
  hiding?: boolean,
  mask?: boolean,
  noAnim?: boolean,
  keepVisible?: boolean,
  hide: () => void
}

export default function FullscreenModal({ children, hiding, transparent = false, mask = false, noAnim = false, keepVisible = false, hide, ...attrs }: Props) {
  const container = useRef<HTMLDivElement>(null);
  let pointerInside = false;
  let keep = false;

  useEffect(() => {
    increaseContainerZIndex();
  }, []);

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
  }, [keepVisible]);

  function handlePointerDown({ target }: PointerEvent) {
    const element = target as HTMLElement;
    keep = keepVisible;

    if (element?.closest(".fullscreen-modal")) {
      pointerInside = true;

      // When date modal is dismissed by clicking outside of it pointer down event is not triggered,
      // to circumvent around that keep an additional variable to check if it's open.
      if (element.closest("[data-modal-keep]")) {
        keep = true;
      }
    }
  }

  function handlePointerUp({ target }: PointerEvent) {
    const element = target as HTMLElement;

    if (pointerInside || keep) {
      pointerInside = false;
    }
    // Selecting an option element with the enter key triggers only a pointerup/click event
    else if (!element.closest("[data-modal-initiator]") && element.nodeName !== "SELECT") {
      hide();
    }
  }

  function handleKeydown({ key }: KeyboardEvent) {
    if (key === "Escape") {
      hide();
    }
  }

  function increaseContainerZIndex() {
    if (container.current) {
      container.current.style.setProperty("--z-index", increaseZIndex("fullscreen-modal").toString());
    }
  }

  const modal = <div className={`fullscreen-modal${hiding ? " hiding" : ""}${noAnim ? " static" : ""}${transparent ? "" : " container"}`} {...attrs} ref={container} onClick={event => handleZIndex(event, "fullscreen-modal")}>{children}</div>;

  if (mask) {
    return <div className="fullscreen-modal-mask">{modal}</div>;
  }
  return modal;
}
