import { useState } from "react";
import Spinner from "../Spinner";
import Icon from "../Icon";
import "./tweet-image-viewer.css";

export default function TweetImageViewer({ data, hide }) {
  const [loaded, setLoaded] = useState(false);
  const [images, setImages] = useState(data.images);
  const [index, setIndex] = useState(data.startIndex);

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

  if (!images) {
    return null;
  }
  return (
    <div className="fullscreen-mask tweet-image-viewer" onClick={handleClick}>
      {!loaded && <Spinner/>}
      <div className={`viewer-image-container${loaded ? " visible" : ""}`}>
        {images.length > 1 && (
          <button className="btn icon-btn viewer-direction-btn left"
            onClick={previousImage} aria-label="Previous image">
            <Icon id="chevron-left" className="viewer-direction-icon"/>
          </button>
        )}
        <img src={images[index].url} className="container viewer-image" onLoad={handleLoad} alt=""/>
        {images.length > 1 && (
          <button className="btn icon-btn viewer-direction-btn right"
            onClick={nextImage} aria-label="Next image">
            <Icon id="chevron-right" className="viewer-direction-icon"/>
          </button>
        )}
        <div className="container viewer-bottom-bar">
          {images.length > 1 && <span>{index + 1}/{images.length}</span>}
          <a href={images[index].url} className="btn icon-btn viewer-open-btn"
            title="Open image in new tab" target="_blank" rel="noreferrer">
            <Icon id="open-in-new"/>
          </a>
        </div>
      </div>
      <button className="btn icon-btn viewer-close-btn" onClick={hide} title="Close">
        <Icon id="cross"/>
      </button>
    </div>
  );
}
