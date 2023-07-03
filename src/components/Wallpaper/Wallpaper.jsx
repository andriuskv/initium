import { useState, useEffect, useRef } from "react";
import { delay } from "../../utils";
import { fetchWallpaperInfo, getIDBWallpaper, resetIDBWallpaper } from "services/wallpaper";
import "./wallpaper.css";

export default function Wallpaper({ settings }) {
  const [wallpaper, setWallpaper] = useState(null);
  const firstRender = useRef(true);
  const videoElementRef = useRef(null);

  useEffect(() => {
    init(settings);
  }, [settings]);

  useEffect(() => {
    if (videoElementRef.current && settings.mimeType?.startsWith("video")) {
      if (!firstRender.current && videoElementRef.current.paused) {
        videoElementRef.current.play();
      }
      videoElementRef.current.playbackRate = settings.videoPlaybackSpeed;
      document.addEventListener("visibilitychange", handlePageVisibilityChange);
    }
    return () => {
      document.removeEventListener("visibilitychange", handlePageVisibilityChange);
    };
  }, [settings, wallpaper]);

  useEffect(() => {
    if (firstRender.current && wallpaper) {
      firstRender.current = false;
      const start = Date.now();

      if (wallpaper.type === "video") {
        videoElementRef.current.addEventListener("canplay", async () => {
          const elapsed = Date.now() - start;

          // Show downscaled wallpaper for at least 200 ms.
          if (elapsed < 200) {
            await delay(200 - elapsed);
          }
          videoElementRef.current.play();
          removeDownscaled();
        });
      }
      else {
        const image = new Image();

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
    }
  }, [wallpaper]);

  async function init(settings) {
    if (settings.type === "blob") {
      let url = wallpaper?.url;

      if (settings.id !== wallpaper?.id) {
        try {
          const file = await getIDBWallpaper(settings.id);
          url = URL.createObjectURL(file);

          setWallpaper({
            id: settings.id,
            type: settings.mimeType?.split("/")[0],
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
        type: settings.mimeType?.split("/")[0],
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

  function handlePageVisibilityChange() {
    if (document.hidden) {
      videoElementRef.current.pause();
    } else {
      videoElementRef.current.play();
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

  if (wallpaper.type === "video") {
    return <video src={wallpaper.url} className="wallpaper-video" loop muted crossOrigin="anonymous" ref={videoElementRef}></video>;
  }
  return (
    <div className="wallpaper" style={{
      backgroundPosition: `${wallpaper.x ?? 50}% ${wallpaper.y ?? 50}%`,
      backgroundImage: `url(${wallpaper.url})`
    }}></div>
  );
}
