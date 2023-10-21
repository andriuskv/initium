import { useEffect, useRef } from "react";
import Icon from "components/Icon";
import "./toast.css";

export default function Toast({ message, duration = 0, position = "top", offset = 0, locale, dismiss }) {
  const dismissTimeoutId = useRef(0);

  useEffect(() => {
    if (duration) {
      dismissTimeoutId.current = setTimeout(dismiss, duration);
    }
    return () => {
      clearTimeout(dismissTimeoutId.current);
    };
  }, [duration]);

  return (
    <div className={`container container-opaque toast ${position}`} style={{ "--offset": offset }}>
      <p className="toast-message">{message}</p>
      <button className="btn icon-btn" onClick={dismiss} title={locale.global.dismiss}>
        <Icon id="cross"/>
      </button>
    </div>
  );
}
