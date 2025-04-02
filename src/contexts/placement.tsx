import type { GeneralSettings, Placement } from "types/settings";
import { type PropsWithChildren, createContext, use, useState, useMemo } from "react";
import * as settingsService from "services/settings";
import { useSettings } from "contexts/settings";

type PlacementContextType = {
  placement: Placement,
  swapPosition: (pos1: keyof Placement, pos2: keyof Placement) => void
  resetPositions: () => void
}

const PlacementContext = createContext<PlacementContextType>({} as PlacementContextType);

function PlacementProvider({ children }: PropsWithChildren) {
  const { updateContextSetting } = useSettings();
  const [placement, setPlacement] = useState(() => {
    const { placement } = settingsService.getSetting("general") as GeneralSettings;
    return placement;
  });
  const memoizedValue = useMemo<PlacementContextType>(() => {
    return {
      placement,
      swapPosition,
      resetPositions
    };
  }, [placement]);

  function swapPosition(pos1: keyof Placement, pos2: keyof Placement) {
    const newPlacement = {
      ...placement,
      [pos1]: placement[pos2],
      [pos2]: placement[pos1],
    };

    setPlacement(newPlacement);

    updateContextSetting("general", { placement: newPlacement });
  }

  function resetPositions() {
    const { general: { placement } } = settingsService.getDefault();

    setPlacement(placement);
    updateContextSetting("general", { placement });
  }

  return <PlacementContext value={memoizedValue}>{children}</PlacementContext>;
}


function usePlacement() {
  return use(PlacementContext);
}

export {
  PlacementProvider,
  usePlacement
};
