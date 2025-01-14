import type { AppearanceSettings } from "types/settings";
import { useState, useRef } from "react";
import { timeout } from "utils";
import { getSetting } from "services/settings";

export default function useModal() {
  const [modal, setModal] = useState<{[key: string]: any, hiding?: boolean }>();
  const timeoutId = useRef(0);

  function hideModal() {
    const { animationSpeed } = getSetting("appearance") as AppearanceSettings;

    if (modal) {
      setModal({ ...modal, hiding: true });
    }
    else {
      setModal({ hiding: true });
    }
    timeoutId.current = timeout(() => {
      setModal(null);
    }, 200 * animationSpeed, timeoutId.current);
  }

  return {
    modal,
    setModal,
    hideModal
  };
}
