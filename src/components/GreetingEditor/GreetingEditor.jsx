import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { timeout } from "utils";
import * as chromeStorage from "services/chromeStorage";
import FullscreenModal from "components/FullscreenModal";
import Dropdown from "components/Dropdown";
import Icon from "components/Icon";
import "./greeting-editor.css";

const Toast = lazy(() => import("components/Toast"));

export default function GreetingEditor({ hiding, locale, hide }) {
  const [textArea, setTextArea] = useState("");
  const [bytes, setBytes] = useState(null);
  const saveTimeoutId = useRef(0);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const greetings = await chromeStorage.get("greetings");

    if (greetings?.length) {
      setTextArea(greetings.join("\n"));
    }
    setByteUsage();
  }

  async function setByteUsage() {
    const { usedFormated, maxFormated } = await chromeStorage.getBytesInUse("greetings");

    setBytes({ usedFormated, maxFormated });
  }

  function dismissMessage() {
    delete bytes.message;
    setBytes({ ...bytes });
  }

  function handleTextareaChange(event) {
    setTextArea(event.target.value);
    saveTimeoutId.current = timeout(() => {
      saveGreetings(event.target.value);
    }, 400, saveTimeoutId.current);
  }

  async function saveGreetings(text) {
    const data = await chromeStorage.set({
      greetings: text.split("\n").filter(line => line).map(line => line.trim())
    }, { warnSize: true });

    if (data.usedRatio === 1) {
      setBytes({
        ...bytes,
        message: data.message
      });
    }
    else {
      setByteUsage();
    }
  }

  return (
    <FullscreenModal hiding={hiding} hide={hide}>
      <div className="greeting-editor">
        <div className="container-header">
          <Dropdown
            toggle={{ title: "Info", iconId: "info" }}
            body={{ className: "greeting-editor-dropdown" }}>
            <ul className="greeting-editor-info-items">
              <li>You can get multiple greetings by separating text with a new line.</li>
              <li>To move greeting text to the new line you can use &lt;br/&gt;.</li>
            </ul>
          </Dropdown>
          {bytes && (
            <span className="greeting-editor-space-usage">{bytes.usedFormated} / {bytes.maxFormated}</span>
          )}
          <h3 className="container-header-title">{locale.greetingEditor.title}</h3>
          <button className="btn icon-btn" onClick={hide} title={locale.global.close}>
            <Icon id="cross"/>
          </button>
        </div>
        {bytes?.message && (
          <Suspense fallback={null}>
            <Toast locale={locale} message={bytes.message} position="bottom" dismiss={dismissMessage}/>
          </Suspense>
        )}
        <textarea className="container-body textarea greeting-editor-textarea" value={textArea} onChange={handleTextareaChange}></textarea>
      </div>
    </FullscreenModal>
  );
}
