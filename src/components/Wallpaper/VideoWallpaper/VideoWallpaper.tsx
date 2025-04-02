import { useEffect, useRef } from "react";
import "./video-wallpaper.css";

type Props = {
  url: string,
  playbackSpeed?: number,
  removeDownscaled: (start: number) => void
}

export default function VideoWallpaper({ url, playbackSpeed, removeDownscaled }: Props) {
  const firstRender = useRef(true);
  const ref = useRef<HTMLVideoElement>(null);
  const timeoutId = useRef(0);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    if (firstRender.current) {
      const start = Date.now();
      firstRender.current = false;

      // Show downscaled images for no longer than 2 seconds
      timeoutId.current = window.setTimeout(() => {
        removeDownscaled(start);
      }, 2000);

      ref.current.addEventListener("canplay", () => {
        clearTimeout(timeoutId.current);
        removeDownscaled(start);
      }, { once: true });
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
    if (!ref.current) {
      return;
    }

    if (document.hidden) {
      ref.current.pause();
    }
    else {
      ref.current.play();
    }
  }

  return <video src={url} className="wallpaper-video" loop muted autoPlay crossOrigin="anonymous" ref={ref}></video>;
}
