import { useState, useEffect, useRef, lazy, Suspense } from "react";
import type { WallpaperSettings } from "types/settings";
import { delay } from "utils";
import { fetchWallpaperInfo, getIDBWallpaper, resetIDBWallpaper } from "services/wallpaper";
import "./wallpaper.css";


type WallpaperType = {
  url: string,
  type?: "image" | "video",
  id?: string;
  x?: number,
  y?: number
}

const VideoWallpaper = lazy(() => import("./VideoWallpaper"));

export default function Wallpaper({ settings }: {settings: WallpaperSettings }) {
  const [wallpaper, setWallpaper] = useState<WallpaperType>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    init(settings);
  }, [settings]);

  useEffect(() => {
    if (firstRender.current && wallpaper) {
      firstRender.current = false;

      if (wallpaper.type !== "video") {
        const start = Date.now();
        const image = new Image();

        image.onload = () => {
          removeDownscaled(start);
        };
        image.src = wallpaper.url;
      }
    }
  }, [wallpaper]);

  async function init(settings: WallpaperSettings) {
    if (settings.type === "blob") {
      let url = wallpaper?.url;

      if (settings.id !== wallpaper?.id) {
        try {
          const file = await getIDBWallpaper(settings.id);
          url = URL.createObjectURL(file);

          setWallpaper({
            id: settings.id,
            type: settings.mimeType?.split("/")[0] as "image" | "video",
            url,
            x: settings.x,
            y: settings.y
          });
        } catch (e) {
          console.log(e);

          const info = await fetchWallpaperInfo();

          if (info) {
            setWallpaper({ url: info.url });
          }
          resetIDBWallpaper();
        }
      }
      else {
        setWallpaper({
          ...wallpaper,
          x: settings.x,
          y: settings.y
        });
      }
    }
    else if (settings.type === "url") {
      setWallpaper({
        url: settings.url,
        type: settings.mimeType?.split("/")[0] as "image" | "video",
        x: settings.x,
        y: settings.y
      });
    }
    else {
      const info = await fetchWallpaperInfo();

      if (info) {
        setWallpaper({ url: info.url });
      }
    }
  }

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

  if (!wallpaper) {
    return null;
  }

  if (wallpaper.type === "video") {
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
