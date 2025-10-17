import type { MouseEvent } from "react";
import type { AppearanceSettings } from "types/settings";
import { useState, useLayoutEffect, useRef } from "react";
import { getSetting } from "services/settings";
import Icon from "components/Icon";
import "./to-top.css";

export default function ToTop({ locale }: { locale: { toTop: { title: string }} }) {
  const [state, setState] = useState<{visible: boolean, hiding?: boolean}>({ visible: false });
  const ref = useRef<HTMLButtonElement>(null);
  const scrolling = useRef(false);

  useLayoutEffect(() => {
    function handleScroll({ target }: Event) {
      if (scrolling.current) {
        return;
      }
      scrolling.current = true;

      requestAnimationFrame(() => {
        scrolling.current = false;

        if (!target) {
          return;
        }

        if ((target as HTMLElement).scrollTop > 0) {
          setState({ visible: true });
        }
        else {
          const { animationSpeed } = getSetting("appearance") as AppearanceSettings;

          setState({ ...state, hiding: true });
          setTimeout(() => {
            setState({ visible: false });
          }, 200 * animationSpeed);
        }
      });
    }

    if (ref.current) {
      ref.current.previousElementSibling!.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (ref.current) {
        ref.current.previousElementSibling!.removeEventListener("scroll", handleScroll);
      }
    };
  }, [state]);

  function handleClick({ currentTarget }: MouseEvent<HTMLButtonElement>) {
    if (currentTarget.previousElementSibling) {
      currentTarget.previousElementSibling.scrollTop = 0;
    }
  }

  return (
    <button className={`btn icon-btn to-top-button${state.visible ? " visible" : ""}${state.hiding ? " hiding" : ""}`}
      onClick={handleClick} ref={ref} title={locale.toTop.title}>
      <Icon id="chevron-up"/>
    </button>
  );
}
