import { useState, useEffect, useRef } from "react";
import { fetchBackgroundInfo, getIDBBackground } from "services/background";
import "./background.css";

export default function Background({ settings }) {
  const [background, setBackground] = useState(null);
  const firstRender = useRef(true);

  useEffect(() => {
    init(settings);
  }, [settings]);

  useEffect(() => {
    if (firstRender.current && background) {
      const image = new Image();
      firstRender.current = false;

      image.onload = () => {
        const element = document.getElementById("downscaled-background");

        if (element) {
          element.classList.add("hide");

          setTimeout(() => {
            element.remove();
          }, 800);
        }
      };
      image.src = background.url;
    }
  }, [background]);

  async function init(settings) {
    if (settings.type === "blob") {
      let url = background?.url;

      if (settings.id !== background?.id) {
        const image = await getIDBBackground(settings.id);
        url = URL.createObjectURL(image);
      }
      setBackground({
        id: settings.id,
        url,
        x: settings.x,
        y: settings.y
      });
    }
    else if (settings.type === "url") {
      setBackground({
        url: settings.url,
        x: settings.x,
        y: settings.y
      });
    }
    else {
      const info = await fetchBackgroundInfo();

      if (info) {
        setBackground({ url: info.url });
      }
    }
  }

  if (!background) {
    return null;
  }
  return (
    <div className="background" style={{
      backgroundPosition: `${background.x ?? 50}% ${background.y ?? 50}%`,
      backgroundImage: `url(${background.url})`
    }}></div>
  );
}
