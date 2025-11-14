import type { CSSProperties, MouseEvent, PropsWithChildren } from "react";
import { useLayoutEffect, useRef } from "react";
import { timeout } from "utils";
import { useLocalization } from "contexts/localization";
import Icon from "components/Icon";
import "./create-button.css";

type Props = PropsWithChildren & {
  className?: string,
  attrs?: Record<string, string | boolean>,
  style?: CSSProperties,
  onClick: (event: MouseEvent<HTMLButtonElement>) => void,
  shiftTarget?: string,
  trackScroll?: boolean,
}

export default function CreateButton({ children, className, attrs = {}, style = {}, onClick, shiftTarget = "", trackScroll = false }: Props) {
  const locale = useLocalization();
  const ref = useRef<HTMLButtonElement>(null);
  const scrolling = useRef(false);
  const scrolled = useRef(false);
  const scrolledId = useRef(0);

  useLayoutEffect(() => {
    if (!trackScroll) {
      return;
    }

    function checkForObstruction(buttonElement: HTMLButtonElement) {
      const elements = buttonElement.previousElementSibling!.querySelectorAll(shiftTarget) as NodeListOf<HTMLElement>;

      if (elements.length) {
        const element = Array.from(elements).at(-1)!;
        const buttonRect = buttonElement.getBoundingClientRect();
        const targetRect = element.getBoundingClientRect();
        const isBeforeTarget = buttonRect.top < targetRect.top && buttonRect.bottom > targetRect.top
          && buttonRect.bottom - targetRect.top > targetRect.height * 0.5;
        const isAfterTarget = buttonRect.top > targetRect.top && buttonRect.top < targetRect.bottom
          && buttonRect.top - targetRect.top < targetRect.height * 0.5;
        const isOnTarget = isBeforeTarget || isAfterTarget;

        if (isOnTarget) {
          const shift = buttonRect.top + buttonRect.height - targetRect.top - 8;

          buttonElement.style.setProperty("--shift", `-${shift}px`);
        }
        else {
          buttonElement.style.setProperty("--shift", "0px");
        }
      }
    }

    function handleScroll({ target }: Event) {
      if (scrolling.current) {
        return;
      }
      const buttonElement = ref.current!;

      if (!scrolled.current) {
        buttonElement.style.setProperty("--shift", "0px");
        scrolled.current = true;
        return;
      }
      scrolling.current = true;

      requestAnimationFrame(() => {
        if (shiftTarget) {
          scrolledId.current = timeout(() => {
            scrolled.current = false;
            checkForObstruction(buttonElement);
          }, 400, scrolledId.current);
          scrolling.current = false;
          return;
        }
        scrolling.current = false;

        if (!target) {
          return;
        }
        const element = target as HTMLElement;

        if (element.scrollTop === 0) {
          buttonElement.classList.remove("shift-up");
        }
        else {
          buttonElement.classList.toggle("shift-up", element.scrollTop + element.offsetHeight >= element.scrollHeight - 32);
        }
      });
    }

    const buttonElement = ref.current!;

    if (shiftTarget) {
      checkForObstruction(buttonElement);
    }
    buttonElement.previousElementSibling!.addEventListener("scroll", handleScroll);

    return () => {
      buttonElement.previousElementSibling!.removeEventListener("scroll", handleScroll);
    };
  }, [trackScroll]);

  return (
    <button className={`btn icon-text-btn create-btn${className ? ` ${className}` : ""}`} { ...attrs } style={{ ...style }} ref={ref} onClick={onClick}>
      <Icon id="plus"/>
      <span className="create-btn-text">{children || locale.global.create}</span>
    </button>
  );
}
