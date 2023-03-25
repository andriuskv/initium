import { useState, useRef } from "react";
import Spinner from "../Spinner";
import Icon from "../Icon";
import "./tweet-image-viewer.css";

export default function TweetImageViewer({ data, hide }) {
  const [loaded, setLoaded] = useState(false);
  const [images, setImages] = useState(data.images);
  const [index, setIndex] = useState(data.startIndex);
  const imgElementRef = useRef();

  function handleLoad({ target }) {
    const { innerWidth, innerHeight } = window;

    target.style.maxWidth = `${innerWidth - 96}px`;
    target.style.maxHeight = `${innerHeight - 64}px`;

    images[index].loaded = true;
    setImages([...images]);

    setTimeout(() => {
      setLoaded(true);
    }, 200);
  }

  function previousImage() {
    const nextIndex = index === 0 ? images.length - 1 : index - 1;

    setIndex(nextIndex);
    setLoaded(images[nextIndex].loaded);
  }

  function nextImage() {
    const nextIndex = index === images.length - 1 ? 0 : index + 1;

    setIndex(nextIndex);
    setLoaded(images[nextIndex].loaded);
  }

  function handleClick({ currentTarget, target }) {
    if (target === currentTarget) {
      hide();
    }
  }

  function downloadImage() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = imgElementRef.current.naturalWidth;
    canvas.height = imgElementRef.current.naturalHeight;

    ctx.drawImage(imgElementRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
      const a = document.createElement("a");
      const url = URL.createObjectURL(blob);
      const filename = imgElementRef.current.src.split("/").at(-1);

      a.download = filename;
      a.href = url;

      a.click();
      URL.revokeObjectURL(url);
    }, "image/jpeg");
  }

  if (!images) {
    return null;
  }
  return (
    <div className="fullscreen-mask tweet-image-viewer" onClick={handleClick}>
      {!loaded && <Spinner className="tweet-image-viewer-spinner"/>}
      <div className={`viewer-image-container${loaded ? " visible" : ""}`}>
        {images.length > 1 && (
          <button className="btn icon-btn viewer-direction-btn left"
            onClick={previousImage} aria-label="Previous image">
            <Icon id="chevron-left" className="viewer-direction-icon"/>
          </button>
        )}
        <img src={images[index].url} className="container viewer-image" onLoad={handleLoad} ref={imgElementRef} crossOrigin="anonymous" alt=""/>
        {images.length > 1 && (
          <button className="btn icon-btn viewer-direction-btn right"
            onClick={nextImage} aria-label="Next image">
            <Icon id="chevron-right" className="viewer-direction-icon"/>
          </button>
        )}
        <div className="container viewer-bottom-bar">
          {images.length > 1 && <span>{index + 1}/{images.length}</span>}
          <div className="viewer-bottom-bar-right">
            <button className="btn icon-btn" onClick={downloadImage} title="Download image">
              <Icon id="download"/>
            </button>
            <a href={images[index].url} className="btn icon-btn"
              title="Open image in new tab" target="_blank" rel="noreferrer">
              <Icon id="open-in-new"/>
            </a>
          </div>
        </div>
      </div>
      <button className="btn icon-btn viewer-close-btn" onClick={hide} title="Close">
        <Icon id="cross"/>
      </button>
    </div>
  );
}
