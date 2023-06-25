import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { getRandomString } from "utils";
import Icon from "components/Icon";
import "./slider.css";

export default function Slider({ label }) {
  const [state, setState] = useState({ id: getRandomString() });
  const memoizedWindowClickHandler = useCallback(handleWindowClick, [state.id]);
  const isMounted = useRef(false);
  const drop = useRef(null);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      window.removeEventListener("click", memoizedWindowClickHandler);
    };
  }, [memoizedWindowClickHandler]);

  useLayoutEffect(() => {
    if (state.reveal) {
      let onTop = false;

      if (state.data) {
        const dropdownHeight = drop.current.getBoundingClientRect().height + 8;

        if (state.data.bottom + dropdownHeight > state.data.height && state.data.top > dropdownHeight) {
          onTop = true;
        }
      }
      setState({
        ...state,
        onTop,
        visible: true
      });
    }
  }, [state.reveal]);

  function toggleDropdown({ currentTarget }) {
    let data = null;

    if (state.visible) {
      window.removeEventListener("click", memoizedWindowClickHandler);
    }
    else {
      const container = currentTarget.parentElement;
      const element = getParentElement(container);

      if (element) {
        element.style.position = "relative";

        data = {
          top: container.offsetTop,
          bottom: container.offsetTop + container.offsetHeight,
          height: element.scrollTop + element.clientHeight
        };

        element.style.position = "";
      }
      window.addEventListener("click", memoizedWindowClickHandler);
    }
    setState({
      id: state.id,
      visible: false,
      reveal: !state.visible,
      data,
      onTop: false
    });
  }

  function handleWindowClick({ target }) {
    const closestContainer = target.closest(".dropdown-container");
    let hideDropdown = true;

    if (closestContainer?.id === state.id) {
      if (target.closest("[data-dropdown-keep]")) {
        hideDropdown = false;
      }
      else {
        hideDropdown = target.closest("a") || target.closest(".dropdown-btn");
      }
    }

    if (hideDropdown) {
      if (isMounted.current) {
        setState({ id: state.id, visible: false, reveal: false });
      }
      window.removeEventListener("click", memoizedWindowClickHandler);
    }
  }

  function getParentElement(element) {
    while (element && !element.hasAttribute("data-dropdown-parent")) {
      element = element.parentElement;
    }
    return element;
  }

  return (
    <div className={`slider-bar-container${className ? ` ${className}` : ""}`}>
      <div className="slider-bar" ref={element} onPointerDown={pointerDownHandler}
        onKeyDown={keyDownHandler} role="slider" tabIndex="0" aria-label={labelText}
        aria-valuemin={min} aria-valuenow={now} aria-valuemax={max} aria-valuetext={nowText}>
        <div className="slider-bar-inner" style={{ "--progress": progress }}>
          <div className="slider-bar-elapsed"></div>
          <div className="slider-bar-thumb"></div>
        </div>
      </div>
      {label ? <div className="slider-label" style={{ "--progress": label.progress }}>{label.text}</div> : null}
    </div>
  );
}
