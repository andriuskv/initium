import { useEffect, useRef } from "react";
import "./video-wallpaper.css";

export default function VideoWallpaper({ url, playbackSpeed, removeDownscaled }) {
  const firstRender = useRef(true);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    if (firstRender.current) {
      const start = Date.now();
      firstRender.current = false;

      ref.current.addEventListener("canplay", () => {
        removeDownscaled(start);
      }, { once: true });
      return;
    }
    document.addEventListener("visibilitychange", handlePageVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handlePageVisibilityChange);
    };
  }, [url]);

  useEffect(() => {
    if (ref.current && typeof playbackSpeed === "number") {
      ref.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  function handlePageVisibilityChange() {
    if (document.hidden) {
      ref.current.pause();
    }
    else {
      ref.current.play();
    }
  }

  return <video src={url} className="wallpaper-video" loop muted autoPlay crossOrigin="anonymous" ref={ref}></video>;
}
