import type { CSSProperties } from "react";
import { useState, useLayoutEffect, useRef } from "react";
import { timeout, getRandomString } from "utils";
import "./tooltip.css";

type Tooltip = {
  id: string;
  text: string;
  type: "hover" | "focus";
}

export default function Tooltip() {
  const [tooltips, setTooltips] = useState<Tooltip[] | null>(null);
  const activeTooltips = useRef(new Set<HTMLElement>());
  const timeoutId = useRef(0);
  const abortController = useRef(new AbortController());

  useLayoutEffect(() => {
    if (!CSS.supports("anchor-name", "--test")) {
      return;
    }

    function handleMouseEnter(event: MouseEvent) {
      if (!event.target) {
        return;
      }
      const tooltipElement: HTMLElement | null = (event.target as HTMLElement).closest("[data-tooltip]");

      if (!tooltipElement || tooltipElement.hasAttribute("data-tooltip-id") || activeTooltips.current.has(tooltipElement)) {
        return;
      }
      activeTooltips.current.add(tooltipElement);
      tooltipElement.addEventListener("pointerleave", resetTooltipElement, { once: true });
      timeoutId.current = timeout(() => {
        const tooltip: Tooltip = {
          id: getRandomString(),
          text: tooltipElement.getAttribute("data-tooltip")!,
          type: "hover"
        };

        addTooltip(tooltip, tooltipElement);
      }, 600, timeoutId.current);
    }

    function handleKeyUp(event: KeyboardEvent) {
      const element = document.activeElement as HTMLElement;

      if (event.key !== "Tab" || !element || element.hasAttribute("data-tooltip-id") || activeTooltips.current.has(element)) {
        return;
      }
      const text = element.getAttribute("data-tooltip");

      if (text) {
        activeTooltips.current.add(element);
        element.addEventListener("blur", resetTooltipElement, { once: true });
        timeoutId.current = timeout(() => {
          const tooltip: Tooltip = {
            id: getRandomString(),
            text,
            type: "focus"
          };

          addTooltip(tooltip, element);
        }, 600, timeoutId.current);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        const elements = document.querySelectorAll("[data-tooltip-id]") as NodeListOf<HTMLElement>;

        for (const element of elements) {
          element.removeAttribute("data-tooltip-id");
          element.style.removeProperty("anchor-name");
        }
        setTooltips(null);
        window.clearTimeout(timeoutId.current);
        activeTooltips.current.clear();
      }
    }

    function addTooltip(tooltip: Tooltip, element: HTMLElement) {
      element.setAttribute("data-tooltip-id", tooltip.id);
      element.style.setProperty("anchor-name", `--anchor-${tooltip.id}`);

      if (tooltips) {
        const index = tooltips.findIndex(item => item.type === tooltip.type);

        if (index >= 0) {
          setTooltips(tooltips.with(index, tooltip));
        }
        else {
          setTooltips([...tooltips, tooltip]);
        }
      }
      else {
        setTooltips([tooltip]);
      }
    }

    function getRemoveTooltipCb(type: string) {
      return () => {
        if (!tooltips) {
          return;
        }
        const index = tooltips.findIndex(item => item.type === type);

        if (index >= 0) {
          setTooltips(tooltips.toSpliced(index, 1));
          abortController.current.abort();
          abortController.current = new AbortController();
        }
      };
    }

    function resetTooltipElement(event: PointerEvent | FocusEvent) {
      const element = event.currentTarget as HTMLElement;

      window.clearTimeout(timeoutId.current);

      if (element) {
        element.removeAttribute("data-tooltip-id");
        activeTooltips.current.delete(element);
      }
    }

    let observer: MutationObserver | null = null;

    if (tooltips?.length) {
      observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          mutation.removedNodes.forEach(node => {
            if (node.nodeName !== "#text") {
              const anchor = (node as HTMLElement).querySelector("[data-tooltip-id]") as HTMLElement;

              if (anchor) {
                const id = anchor.getAttribute("data-tooltip-id");
                activeTooltips.current.delete(anchor);
                anchor.removeAttribute("data-tooltip-id");

                setTooltips(tooltips.filter(tooltip => tooltip.id !== id));
              }
            }
          });
        });
      });

      observer.observe(document.getElementById("root")!, { subtree: true, childList: true });

      for (const tooltip of tooltips) {
        const element = document.querySelector(`[data-tooltip-id='${tooltip.id}']`);

        if (element) {
          element.addEventListener("pointerleave", getRemoveTooltipCb("hover"), { once: true, signal: abortController.current.signal });
          element.addEventListener("blur", getRemoveTooltipCb("focus"), { once: true, signal: abortController.current.signal });
        }
        else {
          setTooltips(tooltips.filter(item => item.id !== tooltip.id));
        }
      }
    }

    document.getElementById("root")!.addEventListener("pointerover", handleMouseEnter);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.getElementById("root")!.removeEventListener("pointerover", handleMouseEnter);
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("keydown", handleKeyDown);
      abortController.current.abort();
      abortController.current = new AbortController();

      if (observer) {
        observer.disconnect();
      }
    };
  }, [tooltips]);

  if (!tooltips) {
    return null;
  }
  return (
    <>
      {tooltips.map(tooltip => (
        <div id={tooltip.id} role="tooltip" className="tooltip" style={{ "positionAnchor": `--anchor-${tooltip.id}` } as CSSProperties} key={tooltip.id}>
          <p className="tooltip-text">{tooltip.text}</p>
        </div>
      ))}
    </>
  );
}
