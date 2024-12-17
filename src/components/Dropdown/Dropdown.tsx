import { MouseEvent, useState, useEffect, useLayoutEffect, useRef, useMemo, PropsWithChildren, ReactNode } from "react";
import { getRandomString, timeout } from "utils";
import * as focusService from "services/focus";
import { getSetting } from "services/settings";
import { useLocalization } from "contexts/localization";
import Icon from "components/Icon";
import "./dropdown.css";
import { AppearanceSettings } from "types/settings";

type Props = PropsWithChildren & {
  container?: {
    className: string
  },
  toggle?: {
    className?: string,
    isIconTextBtn?: boolean,
    iconId?: string,
    title?: string,
    body?: ReactNode
  },
  body?: {
    className: string
   }
}

type State = {
  id: string,
  visible?: boolean,
  reveal?: boolean,
  hiding?: boolean,
  onTop?: boolean,
  data?: {
    top: number,
    bottom: number,
    height: number
  } | null;
}

export default function Dropdown({ container, toggle = {}, body, children }: Props) {
  const locale = useLocalization();
  const [state, setState] = useState<State>({ id: getRandomString() });
  const memoizedWindowClickHandler = useMemo(() => handleWindowClick, [state.id]);
  const isMounted = useRef(false);
  const drop = useRef<HTMLDivElement>(null);
  const timeoutId = useRef(0);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      window.removeEventListener("click", memoizedWindowClickHandler);
    };
  }, [memoizedWindowClickHandler]);

  useEffect(() => {
    if (state.visible) {
      focusService.setInitiator(document.activeElement as HTMLElement);
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

      if (state.data && drop.current) {
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

  function toggleDropdown(event: MouseEvent) {
    if (state.visible) {
      hideDropdown();
      return;
    }
    const currentTarget = event.currentTarget as HTMLElement;
    const container = currentTarget.parentElement!;
    const element = getParentElement(container);
    let data: State["data"] = null;

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

    setState({
      id: state.id,
      visible: false,
      reveal: !state.visible,
      data,
      onTop: false
    });
  }

  function handleKeyUp(event: KeyboardEvent) {
    if (event.key === "Escape" || (event.key === "Tab" && !drop.current.contains(event.target as HTMLElement))) {
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
        shouldHide = target.closest("a") || target.closest(".dropdown-btn") || target.closest("[data-dropdown-close]");
      }
    }

    if (shouldHide) {
      hideDropdown();
    }
  }

  function hideDropdown() {
    if (isMounted.current) {
      const { animationSpeed } = getSetting("appearance") as AppearanceSettings;

      setState({ ...state, id: state.id, hiding: true });

      timeoutId.current = timeout(() => {
        setState({ id: state.id, visible: false, reveal: false });
      }, 100 * animationSpeed, timeoutId.current);
    }
    window.removeEventListener("click", memoizedWindowClickHandler);
  }

  function getParentElement(element: HTMLElement) {
    while (element && !element.hasAttribute("data-dropdown-parent")) {
      element = element.parentElement;
    }
    return element;
  }

  function renderToggleButton() {
    const className = `${toggle.className ? ` ${toggle.className}` : ""}${state.visible ? " active" : ""}`;

    if (toggle.isIconTextBtn) {
      return (
        <button type="button" className={`btn icon-text-btn dropdown-toggle-btn${className}`}
          onClick={toggleDropdown}>
          <Icon id={toggle.iconId || "vertical-dots"}/>
          <span>{toggle.title}</span>
        </button>
      );
    }
    return (
      <button type="button" className={`btn icon-btn dropdown-toggle-btn${className}`}
        onClick={toggleDropdown} title={toggle.title || locale.global.more}>
        {toggle.body ? toggle.body : <Icon id={toggle.iconId || "vertical-dots"}/>}
      </button>
    );
  }

  return (
    <div id={state.id} className={`dropdown-container${container ? ` ${container.className}` : ""}${state.visible ? " visible" : ""}`}>
      {renderToggleButton()}
      <div role="menu" className={`container container-opaque dropdown${body ? ` ${body.className}` : ""}${state.reveal ? " reveal" : ""}${state.visible ? " visible" : ""}${state.onTop ? " top" : ""}${state.hiding ? " hiding" : ""}`} ref={drop}>{children}</div>
    </div>
  );
}
