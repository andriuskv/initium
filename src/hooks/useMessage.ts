import { useState, useRef } from "react";
import { timeout } from "utils";

export default function useMessage(initialValue: string) {
  const [message, setMessage] = useState(initialValue);
  const timeoutId = useRef(0);

  function showMessage(message: string) {
    setMessage(message);

    timeoutId.current = timeout(() => {
      setMessage("");
    }, 4000, timeoutId.current);
  }

  function dismissMessage() {
    clearTimeout(timeoutId.current);
    setMessage("");
  }
  return {
    message,
    showMessage,
    dismissMessage
  };
}
