/* global chrome */

import { useState, useEffect, useCallback } from "react";
import { formatBytes } from "utils";
import { useModal } from "hooks";
import { getBytesInUse } from "services/chromeStorage";
import Modal from "components/Modal";
import Icon from "components/Icon";
import "./storage-tab.css";

export default function StorageTab({ locale }) {
  const [items, setItems] = useState(null);
  const [stats, setStats] = useState(() => ({
    usedStorageFormatted: 0,
    usedStorage: 0,
    usedStorageInPercent: 0,
    dashoffset: 1000
  }));
  const [modal, setModal, hideModal] = useModal(null);
  const memoizedChangeHandler = useCallback(handleStorageChange, [items, stats]);

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
    const items = [
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
    ];

    const maxStoragePerItem = chrome.storage.sync.QUOTA_BYTES_PER_ITEM || 8192;
    let usedStorage = 0;

    for (const item of items) {
      const bytes = await getBytesInUse(item.name);
      usedStorage += bytes;
      item.bytes = bytes;
      item.usageRatio = bytes / maxStoragePerItem;
      item.usedStorage = formatBytes(bytes);
    }
    const maxStorage = items.length * maxStoragePerItem;
    const usageRatio = usedStorage / maxStorage;

    setStats({
      maxStorage,
      maxStoragePerItem,
      usedStorage,
      maxStorageFormatted: formatBytes(maxStorage),
      usedStorageInPercent: Math.ceil(usageRatio * 100),
      usedStorageFormatted: formatBytes(usedStorage),
      // 1000 = empty circle, 717 = full circle
      dashoffset: 1000 - 283 * usageRatio
    });

    setItems(items);
  }

  async function handleStorageChange(storage) {
    const [name] = Object.keys(storage);
    const bytes = await getBytesInUse(name);
    const item = items.find(item => item.name === name);
    const byteDiff = bytes - item.bytes;
    const usedStorage = stats.usedStorage + byteDiff;
    const usageRatio = usedStorage / stats.maxStorage;

    item.bytes = bytes;
    item.usageRatio = bytes / stats.maxStoragePerItem;
    item.usedStorage = formatBytes(bytes);

    setItems([...items]);
    setStats({
      ...stats,
      usedStorage,
      usedStorageInPercent: Math.ceil(usageRatio * 100),
      usedStorageFormatted: formatBytes(usedStorage),
      // 1000 = empty circle, 717 = full circle
      dashoffset: 1000 - 283 * usageRatio
    });
  }

  function confirmModalAction() {
    setModal(null);
    chrome.storage.sync.remove(modal.name);
  }

  if (!items) {
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
                <div className={`storage-item-bar-inner${item.usageRatio > 0.9 ? " full" : ""}`}
                  style={{ "--scale": item.usageRatio, "--index": i }}>
                </div>
              </div>
            </div>
            <button className="btn icon-btn alt-icon-btn" onClick={() => setModal(item)} title={locale.global.delete}>
              <Icon id="trash"/>
            </button>
          </li>
        ))}
      </ul>
      {modal && (
        <Modal hiding={modal.hiding} hide={hideModal}>
          <h4 className="modal-title">Delete {modal.fullName} data?</h4>
          <div className="modal-text-body">
            <p>Do you really want to delete {modal.fullName} data?</p>
            <p>All associated data will be removed.</p>
          </div>
          <div className="modal-actions">
            <button className="btn text-btn" onClick={hideModal}>{locale.global.cancel}</button>
            <button className="btn" onClick={confirmModalAction}>{locale.global.delete}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
