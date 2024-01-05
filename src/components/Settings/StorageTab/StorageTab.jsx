/* global chrome */

import { useState, useEffect, useCallback, useRef } from "react";
import { formatBytes, timeout } from "utils";
import { useModal } from "hooks";
import * as chromeStorage from "services/chromeStorage";
import Modal from "components/Modal";
import Icon from "components/Icon";
import "./storage-tab.css";

const maxStoragePerItem = chrome.storage.sync.QUOTA_BYTES_PER_ITEM || 8192;

export default function StorageTab({ locale }) {
  const [items, setItems] = useState(() => [
    {
      name: "tasks",
      fullName: locale.tasks.title
    },
    {
      name: "notepad",
      fullName: locale.notepad.title
    },
    {
      name: "feeds",
      fullName: locale.settings.storage.rss_feeds
    },
    {
      name: "reminders",
      fullName: locale.settings.storage.calendar_reminders
    },
    {
      name: "timer",
      fullName: locale.settings.storage.timer_presets
    },
    {
      name: "countdowns",
      fullName: locale.settings.storage.countdowns
    },
    {
      name: "greetings",
      fullName: locale.settings.storage.greetings
    },
    {
      name: "persistentSites",
      fullName: locale.settings.storage.persistent_sites
    },
    {
      name: "shortcuts",
      fullName: locale.bottomPanel.shortcuts
    },
    {
      name: "clocks",
      fullName: locale.settings.storage.world_clocks
    },
    {
      name: "stickyNotes",
      fullName: locale.settings.storage.sticky_notes
    }
  ]);
  const [stats, setStats] = useState(() => getInitStats());
  const [dataMessage, setDataMessage] = useState("");
  const [modal, setModal, hideModal] = useModal(null);
  const memoizedChangeHandler = useCallback(handleStorageChange, [items, stats]);
  const ready = useRef(false);
  const storageItems = useRef([]);
  const storageTimeoutId = useRef(0);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    chrome.storage.sync.onChanged.addListener(memoizedChangeHandler);

    return () => {
      chrome.storage.sync.onChanged.removeListener(memoizedChangeHandler);
    };
  }, [memoizedChangeHandler]);

  async function init() {
    let usedStorage = 0;

    for (const item of items) {
      const bytes = await chromeStorage.getBytesInUse(item.name);
      usedStorage += bytes;
      item.bytes = bytes;
      item.usageRatio = bytes / maxStoragePerItem;
      item.usedStorage = formatBytes(bytes);
    }
    const maxStorage = items.length * maxStoragePerItem;
    const usageRatio = usedStorage / maxStorage;

    setItems([...items]);
    setStats({
      maxStorage,
      usedStorage,
      maxStorageFormatted: formatBytes(maxStorage),
      usedStorageInPercent: Math.ceil(usageRatio * 100),
      usedStorageFormatted: formatBytes(usedStorage),
      // 1000 = empty circle, 717 = full circle
      dashoffset: 1000 - 283 * usageRatio
    });
    ready.current = true;
  }

  async function handleStorageChange(storage) {
    const [name] = Object.keys(storage);

    storageItems.current.push(name);

    storageTimeoutId.current = timeout(() => {
      updateStorageItems();
    }, 100, storageTimeoutId.current);
  }

  async function updateStorageItems() {
    let usedStorage = stats.usedStorage;

    for (const name of storageItems.current) {
      const bytes = await chromeStorage.getBytesInUse(name);
      const item = items.find(item => item.name === name);
      const byteDiff = bytes - item.bytes;

      item.bytes = bytes;
      item.usageRatio = bytes / maxStoragePerItem;
      item.usedStorage = formatBytes(bytes);

      usedStorage += byteDiff;
    }
    const usageRatio = usedStorage / stats.maxStorage;

    setItems([...items]);
    setStats({
      ...stats,
      usedStorage,
      usedStorageInPercent: Math.ceil(usageRatio * 100),
      usedStorageFormatted: formatBytes(usedStorage),
      // 1000 = empty circle, 717 = full circle
      dashoffset: 1000 - 283 * usageRatio
    });
    storageItems.current.length = 0;
  }

  function getInitStats() {
    return {
      usedStorageFormatted: 0,
      usedStorage: 0,
      usedStorageInPercent: 0,
      dashoffset: 1000
    };
  }

  function showRemoveItemModal(item) {
    setModal({
      type: "item",
      title: `Delete ${item.fullName} data?`,
      body: `
        Do you really want to delete ${item.fullName} data?
        All associated data will be removed.`.trim(),
      item
    });
  }

  async function createDataBackup() {
    const { default: saveAs } = await import("file-saver");
    const backup = {};

    for (const item of items) {
      const data = await chromeStorage.get(item.name);

      if (data) {
        backup[item.name] = data;
      }
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });

    saveAs(blob, "initium-new-tab-backup.json");
  }

  function showRestoreModal() {
    setDataMessage("");
    setModal({
      type: "restore",
      title: "Data restore",
      body: `
        Do you want to restore data from the backup?
        This will cause all present data to be overwritten.`.trim(),
      confirmInputValue: ""
    });
  }

  function showWipeDataModal() {
    setModal({
      type: "wipe-data",
      title: "Wipe all data",
      body: "This will wipe all the data across all the devices.",
      confirmInputValue: ""
    });
  }

  async function restoreFromBackup(event) {
    event.preventDefault();

    try {
      if (modal.confirmInputValue !== "restore") {
        return;
      }
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{
          accept: {
            "application/json": [".json"]
          }
        }]
      });
      setModal(null);

      const file = await fileHandle.getFile();

      if (file.type !== "application/json") {
        setDataMessage("Invalid file type.");
        return;
      }

      try {
        const json = JSON.parse(await file.text());

        for (const key of Object.keys(json)) {
          const isKeyPresent = items.some(item => item.name === key);

          if (isKeyPresent) {
            chromeStorage.set({ [key]: json[key] }, true);
          }
        }
      } catch (e) {
        setDataMessage("Invalid json file.");
      }
    } catch (e) {
      console.log(e);
    }
  }

  function wipeAllData(event) {
    event.preventDefault();

    if (modal.confirmInputValue !== "wipe all data") {
      return;
    }
    for (const item of items) {
      chrome.storage.sync.remove(item.name);
    }
    setModal(null);
  }

  function handleImportInputChange(event) {
    setModal({ ...modal, confirmInputValue: event.target.value });
  }

  function removeItem() {
    setModal(null);
    chrome.storage.sync.remove(modal.item.name);
  }

  function renderModal() {
    if (modal.type === "item") {
      return (
        <Modal hiding={modal.hiding} hide={hideModal}>
          <h4 className="modal-title">{modal.title}</h4>
          <div className="modal-text-body">{modal.body}</div>
          <div className="modal-actions">
            <button className="btn text-btn" onClick={hideModal}>{locale.global.cancel}</button>
            <button className="btn" onClick={removeItem}>{locale.global.delete}</button>
          </div>
        </Modal>
      );
    }
    else if (modal.type === "restore") {
      return (
        <Modal hiding={modal.hiding} hide={hideModal}>
          <form onSubmit={restoreFromBackup}>
            <h4 className="modal-title">{modal.title}</h4>
            <div className="modal-text-body">{modal.body}</div>
            <div className="storage-confirm-input-container">
              <label>
                <div>For confirmation type: <b>restore</b></div>
                <input type="text" className="input" autoComplete="off"
                  onChange={handleImportInputChange} value={modal.confirmInputValue} required/>
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn text-btn" onClick={hideModal}>{locale.global.cancel}</button>
              <button className="btn" disabled={modal.confirmInputValue !== "restore"}>{locale.global.restore}</button>
            </div>
          </form>
        </Modal>
      );
    }
    else if (modal.type === "wipe-data") {
      return (
        <Modal hiding={modal.hiding} hide={hideModal}>
          <form onSubmit={wipeAllData}>
            <h4 className="modal-title">{modal.title}</h4>
            <div className="modal-text-body">{modal.body}</div>
            <div className="storage-confirm-input-container">
              <label>
                <div>For confirmation type: <b>wipe all data</b></div>
                <input type="text" className="input" autoComplete="off"
                  onChange={handleImportInputChange} value={modal.confirmInputValue} required/>
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn text-btn" onClick={hideModal}>{locale.global.cancel}</button>
              <button className="btn" disabled={modal.confirmInputValue !== "wipe all data"}>{locale.global.confirm}</button>
            </div>
          </form>
        </Modal>
      );
    }
    return null;
  }

  if (!ready.current) {
    return null;
  }
  return (
    <div className="container-body setting-tab">
      <div className="storage-usage">
        <div className="storage-usage-numerical">
          <div className="storage-usage-current-numerical">
            <span>{stats.usedStorageFormatted}</span>
            <span className="storage-usage-current-numerical-units">kB</span>
          </div>
          <div>Used of {stats.maxStorageFormatted} kB</div>
        </div>
        <div className="storage-usage-percental">
          <svg viewBox="0 0 100 100" className="storage-usage-visual">
            <circle cx="50" cy="50" r="45"/>
            <circle cx="50" cy="50" r="45" strokeDasharray="1000"
              className={`storage-usage-current-visual${stats.dashoffset < 745.3 ? " full" : ""}`}
              style={{ "--dashoffset": stats.dashoffset }}/>
          </svg>
          <div className="storage-usage-current-percental">{stats.usedStorageInPercent}%</div>
          <div>{locale.settings.storage.used_label}</div>
        </div>
      </div>
      <ul>
        {items.map((item, i) => (
          <li className="storage-item" key={i}>
            <div className="storage-item-main">
              <div className="storage-item-info">
                <div>{item.fullName}</div>
                <div>{item.usedStorage} kB</div>
              </div>
              <div className="storage-item-bar">
                {item.usageRatio > 0 ? (
                  <div className={`storage-item-bar-inner${item.usageRatio > 0.9 ? " full" : ""}`}
                    style={{ "--scale": item.usageRatio, "--index": i }}>
                  </div>
                ) : null}
              </div>
            </div>
            <button className="btn icon-btn alt-icon-btn" onClick={() => showRemoveItemModal(item)} title={locale.global.delete}>
              <Icon id="trash"/>
            </button>
          </li>
        ))}
      </ul>
      <div className="storage-data">
        <h4 className="storage-data-title">Data Management</h4>
        {dataMessage ? <p className="storage-data-message">{dataMessage}</p> : null}
        <div className="storage-data-btns">
          <button className="btn icon-text-btn alt-icon-text-btn" onClick={createDataBackup}>
            <Icon id="download"/>
            <span>Backup</span>
          </button>
          <button className="btn icon-text-btn alt-icon-text-btn" onClick={showRestoreModal}>
            <Icon id="upload"/>
            <span>Restore</span>
          </button>
          <button className="btn icon-text-btn alt-icon-text-btn" onClick={showWipeDataModal}>
            <Icon id="trash"/>
            <span>Wipe all</span>
          </button>
        </div>
      </div>
      {modal && renderModal()}
    </div>
  );
}
