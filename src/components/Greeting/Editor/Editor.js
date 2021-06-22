/* global chrome */

import { useState, useEffect, useRef } from "react";
import { useSettings } from "contexts/settings-context";
import * as chromeStorage from "services/chromeStorage";
import Dropdown from "components/Dropdown";
import Icon from "components/Icon";
import "./editor.css";

export default function Editor({ hide }) {
  const { settings: { greeting: settings }, updateSetting, toggleSetting, setSetting } = useSettings();
  const [textArea, setTextArea] = useState("");
  const [bytes, setBytes] = useState(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
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
        max: formatBytes(chrome.storage.sync.QUOTA_BYTES_PER_ITEM)
      });
    });
  }

  function formatBytes(bytes) {
    const kb = bytes / 1024;
    const value = kb % 1 === 0 ? kb : kb.toFixed(2);

    return `${value} kB`;
  }

  function toggleSettings() {
    setSettingsVisible(!settingsVisible);

    if (!settings) {
      setSetting("greeting", {
        useBoldText: false,
        textSize: 18
      });
    }
  }

  function hideMessage() {
    delete bytes.message;
    setBytes({ ...bytes });
  }

  function handleTextareaChange(event) {
    setTextArea(event.target.value);
    clearTimeout(saveTimeoutId.current);
    saveTimeoutId.current = setTimeout(() => {
      saveGreetings(event.target.value);
    }, 400);
  }

  function toggleBoldnessSetting() {
    toggleSetting("greeting", "useBoldText");
  }

  function handleRangeInputChange({ target }) {
    clearTimeout(saveTimeoutId.current);
    saveTimeoutId.current = setTimeout(() => {
      updateSetting("greeting", { textSize: Number(target.value) });
    }, 1000);
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
    <div className="greeting-editor-mask fullscreen-mask">
      <div className="container greeting-editor">
        <div className="greeting-editor-header">
          <Dropdown
            container={{ className: "" }}
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
          <h3 className="greeting-editor-header-title">Greeting Editor</h3>
          <button className="btn icon-btn greeting-editor-settings-btn" onClick={toggleSettings} title="Settings">
            <Icon id="settings"/>
          </button>
          <button className="btn icon-btn greeting-editor-hide-btn" onClick={hide} title="Close">
            <Icon id="cross"/>
          </button>
        </div>
        {settingsVisible && (
          <div className="greeting-settings">
            <label className="greeting-setting">
              <input type="checkbox" className="sr-only checkbox-input"
                checked={settings.useBoldText}
                onChange={toggleBoldnessSetting}/>
              <div className="checkbox">
                <div className="checkbox-tick"></div>
              </div>
              <span className="label-right">Use bold text</span>
            </label>
            <label className="greeting-setting">
              <span className="label-left">Text size</span>
              <input type="range" className="range-input" min="14" max="32" step="1"
                defaultValue={settings.textSize} onChange={handleRangeInputChange}/>
            </label>
          </div>
        )}
        {bytes?.message && (
          <div className="greeting-editor-message-container">
            <p className="greeting-editor-message">{bytes.message}</p>
            <button className="btn icon-btn" onClick={hideMessage}>
              <Icon id="cross"/>
            </button>
          </div>
        )}
        <textarea className="greeting-editor-textarea" value={textArea} onChange={handleTextareaChange}></textarea>
      </div>
    </div>
  );
}
