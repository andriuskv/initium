import { useState, useEffect, useRef } from "react";
import { fetchWallpaperInfo, getIDBWallpaper } from "services/wallpaper";
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
      firstRender.current = false;

      image.onload = () => {
        const element = document.getElementById("downscaled-wallpaper");

        if (element) {
          element.classList.add("hide");

          setTimeout(() => {
            element.remove();
          }, 600);
        }
      };
      image.src = wallpaper.url;
    }
  }, [wallpaper]);

  async function init(settings) {
    if (settings.type === "blob") {
      let url = wallpaper?.url;

      if (settings.id !== wallpaper?.id) {
        const image = await getIDBWallpaper(settings.id);
        url = URL.createObjectURL(image);
      }
      setWallpaper({
        id: settings.id,
        url,
        x: settings.x,
        y: settings.y
      });
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
