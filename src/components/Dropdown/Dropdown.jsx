import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { getRandomString } from "utils";
import * as focusService from "services/focus";
import Icon from "components/Icon";
import "./dropdown.css";

export default function Dropdown({ container, toggle = {}, body, children }) {
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

  useEffect(() => {
    if (state.visible) {
      focusService.setInitiator(document.activeElement);
      focusService.trapFocus("dropdown", drop.current, { excludeDropdown: false });

      window.addEventListener("keyup", handleKeyUp);
    }
    return () => {
      if (state.visible) {
        focusService.focusInitiator("dropdown");
        focusService.clearFocusTrap("dropdown");
      }
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [state.reveal, state.visible]);

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
          bottom: container.offsetTop + currentTarget.offsetHeight,
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

  function handleKeyUp(event) {
    if (event.key === "Escape" || (event.key === "Tab" && !drop.current.contains(event.target))) {
      hideDropdown();
    }
  }

  function handleWindowClick({ target }) {
    const closestContainer = target.closest(".dropdown-container");
    let shouldHide = true;

    if (closestContainer?.id === state.id) {
      if (target.closest("[data-dropdown-keep]")) {
        shouldHide = false;
      }
      else {
        shouldHide = target.closest("a") || target.closest(".dropdown-btn");
      }
    }

    if (shouldHide) {
      hideDropdown();
    }
  }

  function hideDropdown() {
    if (isMounted.current) {
      setState({ id: state.id, visible: false, reveal: false });
    }
    window.removeEventListener("click", memoizedWindowClickHandler);
  }

  function getParentElement(element) {
    while (element && !element.hasAttribute("data-dropdown-parent")) {
      element = element.parentElement;
    }
    return element;
  }

  return (
    <div id={state.id} className={`dropdown-container${container ? ` ${container.className}` : ""}${state.visible ? " visible" : ""}`}>
      {toggle.isIconTextBtn ? (
        <button className={`btn icon-text-btn${toggle.className ? ` ${toggle.className}` : ""}${state.visible ? " active" : ""}`}
          onClick={toggleDropdown}>
          <Icon id={toggle.iconId || "vertical-dots"}/>
          <span>{toggle.title}</span>
        </button>
      ) : (
        <button className={`btn icon-btn${toggle.className ? ` ${toggle.className}` : ""}${state.visible ? " active" : ""}`}
          onClick={toggleDropdown} title={toggle.title || "More"}>
          <Icon id={toggle.iconId || "vertical-dots"}/>
        </button>
      )}
      <div ref={drop} className={`container container-opaque dropdown${body ? ` ${body.className}` : ""}${state.reveal ? " reveal" : ""}${state.visible ? " visible" : ""}${state.onTop ? " top" : ""}`}>{children}</div>
    </div>
  );
}
