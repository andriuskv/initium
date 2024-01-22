import { useLayoutEffect, useRef } from "react";
import { useLocalization } from "contexts/localization";
import Icon from "components/Icon";
import "./create-button.css";

export default function CreateButton({ children, className, attrs = {}, style = {}, onClick, shiftTarget = "", trackScroll = false }) {
  const locale = useLocalization();
  const ref = useRef(null);
  const scrolling = useRef(false);
  const scrolled = useRef(false);
  const scrolledId = useRef(0);

  useLayoutEffect(() => {
    if (!trackScroll) {
      return;
    }

    if (shiftTarget) {
      checkForObstruction();
    }
    ref.current.previousElementSibling.addEventListener("scroll", handleScroll);

    return () => {
      ref.current.previousElementSibling.removeEventListener("scroll", handleScroll);
    };
  }, [trackScroll]);

  function handleScroll({ target }) {
    if (scrolling.current) {
      return;
    }

    if (!scrolled.current) {
      ref.current.style.setProperty("--shift", "0px");
      scrolled.current = true;
      return;
    }
    scrolling.current = true;

    requestAnimationFrame(() => {
      if (shiftTarget) {
        clearTimeout(scrolledId.current);
        scrolledId.current = setTimeout(() => {
          scrolled.current = false;
          checkForObstruction();
        }, 400);
        scrolling.current = false;
        return;
      }

      if (target.scrollTop === 0) {
        ref.current.classList.remove("shift-up");
      }
      else {
        ref.current.classList.toggle("shift-up", target.scrollTop + target.offsetHeight >= target.scrollHeight - 32);
      }
      scrolling.current = false;
    });
  }

  function checkForObstruction() {
    const elements = ref.current.previousElementSibling.querySelectorAll(shiftTarget);

    if (elements.length) {
      const element = Array.from(elements).at(-1);
      const buttonRect = ref.current.getBoundingClientRect();
      const targetRect = element.getBoundingClientRect();
      const isBeforeTarget = buttonRect.top < targetRect.top && buttonRect.bottom > targetRect.top
        && buttonRect.bottom - targetRect.top > targetRect.height * 0.5;
      const isAfterTarget = buttonRect.top > targetRect.top && buttonRect.top < targetRect.bottom
        && buttonRect.top - targetRect.top < targetRect.height * 0.5;
      const isOnTarget = isBeforeTarget || isAfterTarget;

      if (isOnTarget) {
        const shift = buttonRect.top + buttonRect.height - targetRect.top - 8;

        ref.current.style.setProperty("--shift", `-${shift}px`);
      }
      else {
        ref.current.style.setProperty("--shift", "0px");
      }
    }
  }

  return (
    <button className={`btn icon-text-btn create-btn${className ? ` ${className}` : ""}`} { ...attrs } style={{ ...style }} ref={ref} onClick={onClick}>
      <Icon id="plus"/>
      <span>{children || locale.global.create}</span>
    </button>
  );
}
