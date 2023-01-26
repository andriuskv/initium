import { useState, useEffect, useRef } from "react";
import { delay } from "../../utils";
import { fetchWallpaperInfo, getIDBWallpaper, resetIDBWallpaper } from "services/wallpaper";
import "./wallpaper.css";

export default function Wallpaper({ settings }) {
  const [wallpaper, setWallpaper] = useState(null);
  const firstRender = useRef(true);

  useEffect(() => {
    init(settings);
  }, [settings]);

  useEffect(() => {
    if (firstRender.current && wallpaper) {
      const image = new Image();
      const start = Date.now();
      firstRender.current = false;

      image.onload = async () => {
        const elapsed = Date.now() - start;

        // Show downscaled wallpaper for at least 200 ms.
        if (elapsed < 200) {
          await delay(200 - elapsed);
        }
        removeDownscaled();
      };

      image.src = wallpaper.url;
    }
  }, [wallpaper]);

  async function init(settings) {
    if (settings.type === "blob") {
      let url = wallpaper?.url;

      if (settings.id !== wallpaper?.id) {
        try {
          const image = await getIDBWallpaper(settings.id);
          url = URL.createObjectURL(image);

          setWallpaper({
            id: settings.id,
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
    }
    else if (settings.type === "url") {
      setWallpaper({
        url: settings.url,
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

  function removeDownscaled() {
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
  return (
    <div className="wallpaper" style={{
      backgroundPosition: `${wallpaper.x ?? 50}% ${wallpaper.y ?? 50}%`,
      backgroundImage: `url(${wallpaper.url})`
    }}></div>
  );
}
