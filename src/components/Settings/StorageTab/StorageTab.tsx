import { useState, useEffect, useRef, type CSSProperties } from "react";
import type { Item, Stats } from "./StorageTab.type";
import { formatBytes, parseLocaleString, timeout } from "utils";
import { useModal } from "hooks";
import * as chromeStorage from "services/chromeStorage";
import Modal from "components/Modal";
import Icon from "components/Icon";
import "./storage-tab.css";
import MainUsage from "./MainUsage/MainUsage";
import DataManagement from "./DataManagement/DataManagement";

function getInitStats(itemCount: number): Stats {
  const maxStorage = itemCount * chromeStorage.MAX_QUOTA;

  return {
    maxStorage,
    maxStorageFormatted: formatBytes(maxStorage),
    usedStorageFormatted: "",
    usedStorage: 0,
    usedStorageInPercent: 0,
    dashoffset: 1000
  };
}

function getDefaultItems(locale: any): Item[] {
  return [
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
  ];
}

export default function StorageTab({ locale }: { locale: any }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const { modal, setModal, hiding: modalHiding, hideModal } = useModal();
  const storageItems = useRef<string[]>([]);
  const storageTimeoutId = useRef(0);

  function updateState(usedStorage: number, items: Item[], stats: Stats) {
    const usageRatio = usedStorage / stats.maxStorage;

    setItems(items);
    setStats({
      ...stats,
      usedStorage,
      usedStorageInPercent: Math.ceil(usageRatio * 100),
      usedStorageFormatted: formatBytes(usedStorage, { excludeUnits: true }),
      // 1000 = empty circle, 717 = full circle
      dashoffset: 1000 - 283 * usageRatio
    });
  }

  useEffect(() => {
    async function init() {
      const newItems = getDefaultItems(locale);
      const stats = getInitStats(newItems.length);
      let usedStorage = 0;

      for (const item of newItems) {
        const { used, usedFormated, usedRatio } = await chromeStorage.getBytesInUse(item.name);
        usedStorage += used;
        item.bytes = used;
        item.usageRatio = usedRatio;
        item.usedStorage = usedFormated;
      }
      updateState(usedStorage, newItems, stats);
    }

    init();
  }, []);

  useEffect(() => {
    async function updateStorageItems(storageItems: string[]) {
      if (!items || !stats) {
        return null;
      }
      let newItems = [...items];
      let usedStorage = stats.usedStorage;

      for (const name of storageItems) {
        const { used, usedFormated, usedRatio } = await chromeStorage.getBytesInUse(name);
        const index = items.findIndex(item => item.name === name);

        if (index >= 0) {
          const item = newItems[index];
          const byteDiff = used - (item.bytes || 0);
          usedStorage += byteDiff;
          newItems = newItems.with(index, {
            ...item,
            bytes: used,
            usageRatio: usedRatio,
            usedStorage: usedFormated
          });
        }
      }
      updateState(usedStorage, newItems, stats);
      storageItems.length = 0;
    }

    chromeStorage.subscribeToChanges(storage => {
      const [name] = Object.keys(storage);
      storageItems.current.push(name);

      storageTimeoutId.current = timeout(() => {
        updateStorageItems(storageItems.current);
      }, 100, storageTimeoutId.current);
    }, { id: "storage-tab", listenToLocal: true });

    return () => {
      chromeStorage.removeSubscriber("storage-tab");
    };
  }, [[items, stats]]);

  function showRemoveItemModal(item: Item) {
    setModal({
      type: "item",
      title: parseLocaleString(locale.settings.storage.item_del_title, item.fullName),
      body: parseLocaleString(locale.settings.storage.item_del_message, item.fullName),
      item
    });
  }

  function removeItem() {
    setModal(null);

    if (modal) {
      chromeStorage.remove(modal.item.name);
    }
  }

  if (!items || !stats) {
    return null;
  }

  return (
    <div className="container-body setting-tab">
      <MainUsage locale={locale} stats={stats}/>
      <ul>
        {items.map((item, i) => (
          <li className="storage-item" key={i}>
            <div className="storage-item-main">
              <div className="storage-item-info">
                <div>{item.fullName}</div>
                <div>{item.usedStorage}</div>
              </div>
              <div className="storage-item-bar">
                {typeof item.usageRatio === "number" && item.usageRatio > 0 ? (
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
      <DataManagement locale={locale} items={items}/>
      {modal?.type === "item" ? (
        <Modal hiding={modalHiding} hide={hideModal}>
          <h4 className="modal-title">{modal.title}</h4>
          <div className="modal-text-body">{modal.body}</div>
          <div className="modal-actions">
            <button className="btn text-btn" onClick={hideModal}>{locale.global.cancel}</button>
            <button className="btn" onClick={removeItem}>{locale.global.delete}</button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
