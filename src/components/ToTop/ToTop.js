import { useState, useLayoutEffect, useRef } from "react";
import Icon from "../Icon";
import "./to-top.css";

export default function ToTop() {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const rafId = useRef(0);

  useLayoutEffect(() => {
    ref.current.previousElementSibling.addEventListener("scroll", handleScroll);

    return () => {
      ref.current.previousElementSibling.removeEventListener("scroll", handleScroll);
    };
  }, [visible]);

  function handleScroll({ target }) {
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      setVisible(target.scrollTop > 0);
    });
  }

  function handleClick() {
    ref.current.previousElementSibling.scrollTop = 0;
    setVisible(false);
  }

  return (
    <button className={`btn icon-btn to-top-button${visible ? " visible" : ""}`} ref={ref} onClick={handleClick} title="To top">
      <Icon id="chevron-up"/>
    </button>
  );
}
