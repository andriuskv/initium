/* global chrome */

import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { timeout } from "utils";
import * as chromeStorage from "services/chromeStorage";
import FullscreenModal from "components/FullscreenModal";
import Dropdown from "components/Dropdown";
import Icon from "components/Icon";
import "./greeting-editor.css";

const Toast = lazy(() => import("components/Toast"));

export default function GreetingEditor({ hiding, hide }) {
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

  function setByteUsage() {
    chrome.storage.sync.getBytesInUse("greetings", bytes => {
      setBytes({
        current: formatBytes(bytes),
        max: formatBytes(chrome.storage.sync.QUOTA_BYTES_PER_ITEM || 8192)
      });
    });
  }

  function formatBytes(bytes) {
    const kb = bytes / 1024;
    const value = kb % 1 === 0 ? kb : kb.toFixed(2);

    return `${value} kB`;
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

  function saveGreetings(text) {
    chromeStorage.set({ greetings: text.split("\n").filter(line => line).map(line => line.trim()) }, () => {
      if (chrome.runtime.lastError) {
        setBytes({
          ...bytes,
          message: "Storage usage exceeded."
        });
      }
      else {
        setByteUsage();
      }
    });
  }

  return (
    <FullscreenModal hiding={hiding} hide={hide}>
      <div className="greeting-editor">
        <div className="container-header fullscreen-modal-header">
          <Dropdown
            toggle={{ title: "Info", iconId: "info" }}
            body={{ className: "greeting-editor-dropdown" }}>
            <ul className="greeting-editor-info-items">
              <li>You can get multiple greetings by separating text with a new line.</li>
              <li>To move greeting text to the new line you can use &lt;br/&gt;.</li>
            </ul>
          </Dropdown>
          {bytes && (
            <span className="greeting-editor-space-usage">{bytes.current} / {bytes.max}</span>
          )}
          <h3 className="fullscreen-modal-header-title">Greeting Editor</h3>
          <button className="btn icon-btn" onClick={hide} title="Close">
            <Icon id="cross"/>
          </button>
        </div>
        {bytes?.message && (
          <Suspense fallback={null}>
            <Toast message={bytes.message} position="bottom" dismiss={dismissMessage}/>
          </Suspense>
        )}
        <textarea className="container-body greeting-editor-textarea" value={textArea} onChange={handleTextareaChange}></textarea>
      </div>
    </FullscreenModal>
  );
}
