import type { Area, ImageType } from "../WallpaperViewer.type";
import { useSettings } from "contexts/settings";
import { useLocalization } from "contexts/localization";
import { updateDownscaledWallpaperPosition } from "services/wallpaper";

type Props = {
  area: Area | null,
  image: ImageType | null,
  resetArea: () => void,
  hide: () => void
}

export default function BottomBar({ area, image, resetArea, hide }: Props) {
  const { settings: { appearance: { wallpaper: settings } }, updateContextSetting } = useSettings();
  const locale = useLocalization();

  function getWallpaperPosition(value: number, dimensionName: "width" | "height") {
    const areaDimension = area![dimensionName];
    const imageDimension = image![dimensionName];
    const diff = imageDimension - areaDimension;

    if (diff === 0) {
      return 0;
    }
    return value / diff * 100;
  }

  function saveWallpaperPosition() {
    if (!area) {
      return;
    }
    const x = getWallpaperPosition(area.x, "width");
    const y = getWallpaperPosition(area.y, "height");

    updateContextSetting("appearance", {
      wallpaper: {
        ...settings,
        x,
        y
      }
    });
    updateDownscaledWallpaperPosition(x, y);
    hide();
  }

  return (
    <div className="container wallpaper-viewer-bar">
      <button className="btn text-btn" onClick={resetArea}>{locale.global.reset}</button>
      <button className="btn text-btn" onClick={hide}>{locale.global.cancel}</button>
      <button className="btn text-btn" onClick={saveWallpaperPosition}>{locale.global.save}</button>
    </div>
  );
}
