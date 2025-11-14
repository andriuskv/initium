import { useState, useEffect, useRef, lazy, Suspense } from "react";
import type { WallpaperSettings } from "types/settings";
import { delay } from "utils";
import { fetchWallpaperInfo, getIDBWallpaper, resetIDBWallpaper } from "services/wallpaper";
import "./wallpaper.css";

type WallpaperType = {
  url?: string,
  type?: "image" | "video",
  id?: string;
  x?: number,
  y?: number
}

const VideoWallpaper = lazy(() => import("./VideoWallpaper"));

async function removeDownscaled(start: number) {
  const elapsed = Date.now() - start;
  // Show downscaled wallpaper for at least 200 ms.
  const duration = 200;

  if (elapsed < duration) {
    await delay(duration - elapsed);
  }
  const element = document.getElementById("downscaled-wallpaper");

  if (element) {
    element.classList.add("hide");

    setTimeout(() => {
      element.remove();
    }, 200);
  }
}

export default function Wallpaper({ settings }: {settings: WallpaperSettings }) {
  const [wallpaper, setWallpaper] = useState<WallpaperType | null>(null);
  const firstRender = useRef(true);

  function updateWallpaper(wallpaper: WallpaperType, first: boolean) {
    setWallpaper(wallpaper);

    if (first && wallpaper.type !== "video") {
      const start = Date.now();
      const image = new Image();

      image.onload = () => {
        removeDownscaled(start);
        image.onload = null;
      };

      if (wallpaper.url) {
        image.src = wallpaper.url;
      }
    }
  }


  useEffect(() => {
    async function init(settings: WallpaperSettings, first = false) {
      if (settings.type === "blob") {
        let { id, url } = wallpaper ? wallpaper : {};

        if (settings.id !== id) {
          try {
            const file = await getIDBWallpaper(settings.id!);
            url = URL.createObjectURL(file);

            updateWallpaper({
              id: settings.id,
              type: settings.mimeType?.split("/")[0] as "image" | "video",
              url,
              x: settings.x,
              y: settings.y
            }, first);
          } catch (e) {
            console.log(e);

            const info = await fetchWallpaperInfo();

            if (info) {
              updateWallpaper({ url: info.url }, first);
            }
            resetIDBWallpaper();
          }
        }
        else {
          updateWallpaper({
            ...wallpaper,
            x: settings.x,
            y: settings.y
          }, first);
        }
      }
      else if (settings.type === "url") {
        updateWallpaper({
          url: settings.url,
          type: settings.mimeType?.split("/")[0] as "image" | "video",
          x: settings.x,
          y: settings.y
        }, first);
      }
      else {
        const info = await fetchWallpaperInfo();

        if (info) {
          updateWallpaper({ url: info.url }, first);
        }
      }
    }

    if (firstRender.current) {
      init(settings, true);
      firstRender.current = false;
      return;
    }
    else if (wallpaper) {
      init(settings);
    }
  }, [settings]);


  if (!wallpaper) {
    return null;
  }

  if (wallpaper.type === "video" && wallpaper.url) {
    return (
      <Suspense fallback={null}>
        <VideoWallpaper url={wallpaper.url} playbackSpeed={settings.videoPlaybackSpeed} removeDownscaled={removeDownscaled}/>
      </Suspense>
    );
  }
  return (
    <div className="wallpaper" style={{
      backgroundPosition: `${wallpaper.x ?? 50}% ${wallpaper.y ?? 50}%`,
      backgroundImage: `url(${wallpaper.url})`
    }}></div>
  );
}
