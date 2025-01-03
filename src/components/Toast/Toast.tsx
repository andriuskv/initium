import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import Icon from "components/Icon";
import "./toast.css";

type Props = {
  message: string,
  duration?: number,
  position?: "top" | "bottom",
  offset?: string,
  locale: {
    global: {
      dismiss: string
    }
  },
  dismiss: () => void,
}

export default function Toast({ message, duration = 0, position = "top", offset = "0", locale, dismiss }: Props) {
  const dismissTimeoutId = useRef(0);
  const style ={ "--offset": offset } as CSSProperties;

  useEffect(() => {
    if (duration) {
      dismissTimeoutId.current = window.setTimeout(dismiss, duration);
    }
    return () => {
      clearTimeout(dismissTimeoutId.current);
    };
  }, [duration]);

  return (
    <div className={`container container-opaque toast ${position}`} style={style}>
      <p className="toast-message">{message}</p>
      <button type="button" className="btn icon-btn" onClick={dismiss} title={locale.global.dismiss}>
        <Icon id="cross"/>
      </button>
    </div>
  );
}
