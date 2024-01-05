import { useLayoutEffect, useRef } from "react";
import { getSetting } from "services/settings";
import "./tabs-container.css";

export default function TabsContainer({ className, children, current, offset = 0, itemCount, visible = true, orientation = "h" }) {
  const tabsContainerRef = useRef(null);
  const indicatorRef = useRef(null);
  const prev = useRef(current);
  const isStatic = useRef(current === prev.current);
  const first = useRef(true);

  useLayoutEffect(() => {
    updateIndicator();

    return () => {
      prev.current = current;
    };
  }, [current]);

  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    isStatic.current = true;
    updateIndicator();
  }, [offset, visible, itemCount]);

  function updateIndicator() {
    if (current < 0) {
      return;
    }
    const containerRect = tabsContainerRef.current.getBoundingClientRect();

    // Element is not visible yet
    if (containerRect.width === 0 && containerRect.height === 0) {
      isStatic.current = true;

      if (visible) {
        requestAnimationFrame(updateIndicator);
      }
      return;
    }
    const { animationSpeed } = getSetting("appearance");
    const tabElements = tabsContainerRef.current.children[1].children;
    prev.current = prev.current > tabElements.length - 1 ? current : prev.current;
    const prevActiveItemRect = tabElements[prev.current].getBoundingClientRect();
    const activeItemRect = tabElements[current].getBoundingClientRect();
    let props = {
      start: "left",
      end: "right",
      dimension: "width"
    };

    if (orientation === "v") {
      props = {
        start: "top",
        end: "bottom",
        dimension: "height"
      };
    }
    const containerSize = containerRect[props.dimension];
    const offset = (activeItemRect[props.start] - containerRect[props.start]) / containerSize * 100;

    if (animationSpeed === 0 || isStatic.current) {
      const scale = activeItemRect[props.dimension] / containerSize;

      indicatorRef.current.classList.add("static");
      indicatorRef.current.style.setProperty("--offset", offset);
      indicatorRef.current.style.setProperty("--scale", scale);

      isStatic.current = false;
      return;
    }
    indicatorRef.current.classList.remove("static");

    if (prev.current > current) {
      let scale = (prevActiveItemRect[props.end] - activeItemRect[props.start]) / containerSize;

      indicatorRef.current.style.setProperty("--offset", offset);
      indicatorRef.current.style.setProperty("--scale", scale);

      setTimeout(() => {
        scale = activeItemRect[props.dimension] / containerSize;

        indicatorRef.current.style.setProperty("--scale", scale);
      }, 70 * animationSpeed);
    }
    else {
      let scale = (activeItemRect[props.end] - prevActiveItemRect[props.start]) / containerSize;

      indicatorRef.current.style.setProperty("--scale", scale);

      setTimeout(() => {
        scale = activeItemRect[props.dimension] / containerSize;

        indicatorRef.current.style.setProperty("--offset", offset);
        indicatorRef.current.style.setProperty("--scale", scale);
      }, 70 * animationSpeed);
    }
  }

  return (
    <div className={`${className ? `${className} ` : ""}tabs-container ${orientation}`} ref={tabsContainerRef}>
      <div className={`active-tab-indicator ${orientation}`} ref={indicatorRef}></div>
      {children}
    </div>
  );
}
