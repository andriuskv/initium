import { useState, useRef } from "react";
import { timeout } from "utils";
import { getSetting } from "services/settings";

export default function useModal(initialValue) {
  const [modal, setModal] = useState(initialValue);
  const timeoutId = useRef(0);

  function hideModal() {
    const { animationSpeed } = getSetting("appearance");

    setModal({ ...modal, hiding: true });

    timeoutId.current = timeout(() => {
      setModal(null);
    }, 200 * animationSpeed, timeoutId.current);
  }

  return [
    modal,
    setModal,
    hideModal
  ];
}
