import { useState, useLayoutEffect, useRef } from "react";
import Icon from "../Icon";
import "./to-top.css";

export default function ToTop() {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const scrolling = useRef(false);

  useLayoutEffect(() => {
    ref.current.previousElementSibling.addEventListener("scroll", handleScroll);

    return () => {
      ref.current.previousElementSibling.removeEventListener("scroll", handleScroll);
    };
  }, [visible]);

  function handleScroll({ target }) {
    if (scrolling.current) {
      return;
    }
    scrolling.current = true;

    requestAnimationFrame(() => {
      setVisible(target.scrollTop > 0);
      scrolling.current = false;
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
