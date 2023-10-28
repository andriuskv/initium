import { useState, useLayoutEffect, useRef } from "react";
import { getSetting } from "services/settings";
import Icon from "components/Icon";
import "./to-top.css";

export default function ToTop({ locale }) {
  const [state, setState] = useState({ visible: false });
  const ref = useRef(null);
  const scrolling = useRef(false);

  useLayoutEffect(() => {
    ref.current.previousElementSibling.addEventListener("scroll", handleScroll);

    return () => {
      ref.current.previousElementSibling.removeEventListener("scroll", handleScroll);
    };
  }, [state]);

  function handleScroll({ target }) {
    if (scrolling.current) {
      return;
    }
    scrolling.current = true;

    requestAnimationFrame(() => {
      scrolling.current = false;

      if (target.scrollTop > 0) {
        setState({ visible: true });
      }
      else {
        const { animationSpeed } = getSetting("appearance");

        setState({ ...state, hiding: true });
        setTimeout(() => {
          setState({ visible: false });
        }, 200 * animationSpeed);
      }
    });
  }

  function handleClick() {
    ref.current.previousElementSibling.scrollTop = 0;
  }

  return (
    <button className={`btn icon-btn to-top-button${state.visible ? " visible" : ""}${state.hiding ? " hiding" : ""}`}
      onClick={handleClick} ref={ref} title={locale.toTop.title}>
      <Icon id="chevron-up"/>
    </button>
  );
}
