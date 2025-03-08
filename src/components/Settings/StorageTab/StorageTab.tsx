import { useState, useEffect, useRef, type CSSProperties, type ChangeEvent, type FormEvent } from "react";
import { formatBytes, timeout } from "utils";
import { useModal } from "hooks";
import { getCurrentDateString } from "services/timeDate";
import * as chromeStorage from "services/chromeStorage";
import Modal from "components/Modal";
import Icon from "components/Icon";
import "./storage-tab.css";

type Item = {
  name: string;
  fullName: string;
  bytes?: number;
  usageRatio?: number;
  usedStorage?: string;
}

type Stats = {
  maxStorage?: number;
  maxStorageFormatted?: string;
  usedStorageFormatted: string;
  usedStorage: number;
  usedStorageInPercent: number;
  dashoffset: number;
}

export default function StorageTab({ locale }) {
  const [items, setItems] = useState<Item[]>(() => [
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
      fullName: locale.secondaryPanel.shortcuts
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
  const [stats, setStats] = useState<Stats>(() => getInitStats());
  const [dataMessage, setDataMessage] = useState("");
  const { modal, setModal, hiding: modalHiding, hideModal } = useModal();
  const ready = useRef(false);
  const storageItems = useRef([]);
  const storageTimeoutId = useRef(0);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    chromeStorage.subscribeToChanges(storage => {
      const [name] = Object.keys(storage);
      storageItems.current.push(name);

      storageTimeoutId.current = timeout(() => {
        updateStorageItems();
      }, 100, storageTimeoutId.current);
    }, { id: "storage-tab", listenToLocal: true });

    return () => {
      chromeStorage.removeSubscriber("storage-tab");
    };
  }, [[items, stats]]);

  async function init() {
    let usedStorage = 0;

    for (const item of items) {
      const { used, usedFormated, usedRatio } = await chromeStorage.getBytesInUse(item.name);
      usedStorage += used;
      item.bytes = used;
      item.usageRatio = usedRatio;
      item.usedStorage = usedFormated;
    }
    const maxStorage = items.length * chromeStorage.MAX_QUOTA;
    const usageRatio = usedStorage / maxStorage;

    setItems([...items]);
    setStats({
      maxStorage,
      maxStorageFormatted: formatBytes(maxStorage),
      usedStorage,
      usedStorageInPercent: Math.ceil(usageRatio * 100),
      usedStorageFormatted: formatBytes(usedStorage, { excludeUnits: true }),
      // 1000 = empty circle, 717 = full circle
      dashoffset: 1000 - 283 * usageRatio
    });
    ready.current = true;
  }

  async function updateStorageItems() {
    let usedStorage = stats.usedStorage;

    for (const name of storageItems.current) {
      const { used, usedFormated, usedRatio } = await chromeStorage.getBytesInUse(name);
      const item = items.find(item => item.name === name);
      const byteDiff = used - item.bytes;

      item.bytes = used;
      item.usageRatio = usedRatio;
      item.usedStorage = usedFormated;

      usedStorage += byteDiff;
    }
    const usageRatio = usedStorage / stats.maxStorage;

    setItems([...items]);
    setStats({
      ...stats,
      usedStorage,
      usedStorageInPercent: Math.ceil(usageRatio * 100),
      usedStorageFormatted: formatBytes(usedStorage, { excludeUnits: true }),
      // 1000 = empty circle, 717 = full circle
      dashoffset: 1000 - 283 * usageRatio
    });
    storageItems.current.length = 0;
  }

  function getInitStats(): Stats {
    return {
      usedStorageFormatted: "",
      usedStorage: 0,
      usedStorageInPercent: 0,
      dashoffset: 1000
    };
  }

  function showRemoveItemModal(item: Item) {
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
    const date = getCurrentDateString();

    saveAs(blob, `initium-new-tab-backup-${date}.json`);
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

  async function restoreFromBackup(event: FormEvent) {
    event.preventDefault();

    try {
      if (modal.confirmInputValue !== "restore") {
        return;
      }
      const [fileHandle] = await (window as any).showOpenFilePicker({
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
            chromeStorage.set({ [key]: json[key] }, { updateLocally: true });
          }
        }
      } catch {
        setDataMessage("Invalid json file.");
      }
    } catch (e) {
      console.log(e);
    }
  }

  function wipeAllData(event: FormEvent) {
    event.preventDefault();

    if (modal.confirmInputValue !== "wipe all data") {
      return;
    }
    for (const item of items) {
      chromeStorage.remove(item.name);
    }
    setModal(null);
  }

  function handleImportInputChange(event: ChangeEvent) {
    setModal({ ...modal, confirmInputValue: (event.target as HTMLInputElement).value });
  }

  function removeItem() {
    setModal(null);
    chromeStorage.remove(modal.item.name);
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
          <div>Used of {stats.maxStorageFormatted}</div>
        </div>
        <div className="storage-usage-percental">
          <svg viewBox="0 0 100 100" className="storage-usage-visual">
            <circle cx="50" cy="50" r="45"/>
            <circle cx="50" cy="50" r="45" strokeDasharray="1000"
              className={`storage-usage-current-visual${stats.dashoffset < 745.3 ? " full" : ""}`}
              style={{ "--dashoffset": stats.dashoffset } as CSSProperties}/>
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
                <div>{item.usedStorage}</div>
              </div>
              <div className="storage-item-bar">
                {item.usageRatio > 0 ? (
                  <div className={`storage-item-bar-inner${item.usageRatio > 0.9 ? " full" : ""}`}
                    style={{ "--scale": item.usageRatio, "--index": i } as CSSProperties}>
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
      {modal?.type === "item" ? (
        <Modal hiding={modalHiding} hide={hideModal}>
          <h4 className="modal-title">{modal.title}</h4>
          <div className="modal-text-body">{modal.body}</div>
          <div className="modal-actions">
            <button className="btn text-btn" onClick={hideModal}>{locale.global.cancel}</button>
            <button className="btn" onClick={removeItem}>{locale.global.delete}</button>
          </div>
        </Modal>
      ) : modal?.type === "restore" ? (
        <Modal hiding={modalHiding} hide={hideModal}>
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
      ) : modal?.type === "wipe-data" ? (
        <Modal hiding={modalHiding} hide={hideModal}>
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
      ) : null}
    </div>
  );
}
