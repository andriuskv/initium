import type { AppearanceSettings } from "types/settings";
import { useState, useRef } from "react";
import { timeout } from "utils";
import { getSetting } from "services/settings";

export default function useModal() {
  const [modal, setModal] = useState<{ [key: string]: any } | null>(null);
  const [hiding, setHiding] = useState(false);
  const timeoutId = useRef(0);

  function hideModal() {
    const { animationSpeed } = getSetting("appearance") as AppearanceSettings;

    setHiding(true);

    timeoutId.current = timeout(() => {
      setModal(null);
      setHiding(false);
    }, 200 * animationSpeed, timeoutId.current);
  }

  return {
    modal,
    hiding,
    setModal,
    hideModal
  };
}
