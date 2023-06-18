import { useEffect } from "react";
import Icon from "components/Icon";
import "./fullscreen-modal.css";

export default function FullscreenModal({ content, hide }) {
  const Component = content.component;

  useEffect(() => {
    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  function handleKeydown(event) {
    if (event.key === "Escape") {
      hide();
    }
  }

  return (
    <div className="fullscreen-mask fullscreen-modal-mask">
      <Component {...content.params} hide={hide}/>
      <button className="btn icon-btn fullscreen-modal-close-btn" onClick={hide} title="Close">
        <Icon id="cross"/>
      </button>
    </div>
  );
}
