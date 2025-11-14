import { useState, useEffect, useRef, type MouseEvent as ReactMouseEvent, type SyntheticEvent } from "react";
import type { WallpaperSettings } from "types/settings";
import type { ImageType, Area } from "./WallpaperViewer.type";
import { useSettings } from "contexts/settings";
import { getIDBWallpaper } from "services/wallpaper";
import Spinner from "components/Spinner";
import "./wallpaper-viewer.css";
import BottomBar from "./BottomBar/BottomBar";

type ViewportType = {
  width: number,
  height: number
};

function useUrl({ id, url: imageUrl }: WallpaperSettings): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      if (id) {
        const image = await getIDBWallpaper(id);
        setUrl(URL.createObjectURL(image));
      }
      else if (imageUrl) {
        setUrl(imageUrl);
      }
    }

    init();

    return () => {
      if (id && url) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  return url;
}

export default function WallpaperViewer({ hide }: { hide: () => void }) {
  const { settings: { appearance: { wallpaper: settings } } } = useSettings();
  const url = useUrl(settings);
  const [area, setArea] = useState<Area | null>(null);
  const [image, setImage] = useState<ImageType | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startingPointerPosition = useRef<{ x: number, y: number }>(null);
  const pointerAbortController = useRef<AbortController>(null);
  const updating = useRef(false);

  function handleLoad({ target }: SyntheticEvent<HTMLImageElement>) {
    const { innerWidth, innerHeight } = window;
    const imageElement = target as HTMLImageElement;

    imageElement.style.maxWidth = `${innerWidth - 96}px`;
    imageElement.style.maxHeight = `${innerHeight - 68}px`;

    setTimeout(() => {
      const { width, naturalWidth, height, naturalHeight } = imageElement;
      const image: ImageType = {
        naturalWidth,
        naturalHeight,
        width,
        height
      };

      initArea({ width: innerWidth, height: innerHeight }, image);
      setImage(image);
    }, 200);
  }

  function initArea(viewport: ViewportType, image: ImageType) {
    const { x, y } = settings;
    const { width, height } = getAreaSize(viewport, image);

    setArea({
      width,
      height,
      x: (x ?? 50) * (image.width - width) / 100,
      y: (y ?? 50) * (image.height - height) / 100
    });
  }

  function getAreaSize(viewport: ViewportType, image: ImageType) {
    const { width: viewportWidth, height: viewportHeight } = viewport;
    const { width: containerWidth, height: containerHeight } = image;
    const dimension = getLeastScaledDimension(viewport, image);
    let width = 0;
    let height = 0;

    if (dimension === "height") {
      height = containerHeight;
      width = viewportWidth / viewportHeight * height;

      if (width > containerWidth) {
        width = containerWidth;
        height = viewportHeight / viewportWidth * width;
      }
    }
    else {
      width = containerWidth;
      height = viewportHeight / viewportWidth * width;
    }
    return { width, height };
  }

  function getLeastScaledDimension(viewport: ViewportType, image: ImageType) {
    const { naturalWidth, naturalHeight } = image;
    const { width: viewportWidth, height: viewportHeight } = viewport;
    const widthDiff = Math.abs(naturalWidth - viewportWidth);
    const heightDiff = Math.abs(naturalHeight - viewportHeight);

    if (naturalWidth > viewportWidth || naturalHeight > viewportHeight) {
      return widthDiff > heightDiff ? "height" : "width";
    }
    return widthDiff > heightDiff ? "width" : "height";
  }

  function getPointerPosition({ clientX, clientY }: MouseEvent, target: HTMLElement) {
    const { left, top } = target.getBoundingClientRect();

    return {
      x: clientX - left,
      y: clientY - top
    };
  }

  function normalizeSelectionAreaPosition(value: number, dimensionName: "width" | "height") {
    if (!area || !image) {
      return value;
    }
    const areaDimension = area[dimensionName];
    const imageDimension = image[dimensionName];

    if (value < 0) {
      value = 0;
    }
    else if (value + areaDimension > imageDimension) {
      value = imageDimension - areaDimension;
    }
    return value;
  }

  function handlePointerDown(event: ReactMouseEvent) {
    if (event.buttons === 2) {
      return;
    }
    pointerAbortController.current = new AbortController();
    startingPointerPosition.current = getPointerPosition(event as unknown as MouseEvent, event.currentTarget as HTMLElement);

    window.addEventListener("pointermove", handlePointerMove, { signal: pointerAbortController.current.signal });
    window.addEventListener("pointerup", handlePointerUp, { signal: pointerAbortController.current.signal });
  }

  function handlePointerMove(event: MouseEvent) {
    if (updating.current) {
      return;
    }
    updating.current = true;

    requestAnimationFrame(() => {
      const { x, y } = getPointerPosition(event , containerRef.current as HTMLElement);

      if (area && startingPointerPosition.current) {
        setArea({
          ...area,
          x: normalizeSelectionAreaPosition(x - startingPointerPosition.current.x, "width"),
          y: normalizeSelectionAreaPosition(y - startingPointerPosition.current.y, "height")
        });
      }

      updating.current = false;
    });
  }

  function handlePointerUp() {
    if (pointerAbortController.current) {
      pointerAbortController.current.abort();
      pointerAbortController.current = null;
    }
  }

  function resetArea() {
    if (!area || !image) {
      return;
    }
    setArea({
      ...area,
      x: (image.width / 2) - (area.width / 2),
      y: (image.height / 2) - (area.height / 2)
    });
  }

  return (
    <>
      {image ? null : <Spinner className="wallpaper-viewer-spinner"/>}
      <div className={`wallpaper-viewer-image-content${image ? "" : " hidden"}`}>
        <div className="container wallpaper-viewer-image-container" ref={containerRef}>
          <img src={url!} className="wallpaper-viewer-image" onLoad={handleLoad}/>
          {area && <div className="wallpaper-viewer-area" style={{
            width: `${area.width}px`,
            height: `${area.height}px`,
            transform: `translate(${area.x}px, ${area.y}px)`
          }} onPointerDown={handlePointerDown}></div>}
        </div>
        <BottomBar area={area} image={image} resetArea={resetArea} hide={hide}/>
      </div>
    </>
  );
}
