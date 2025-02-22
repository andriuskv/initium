/* global chrome */

import { useState, useEffect } from "react";
import * as chromeStorage from "services/chromeStorage";
import { SortableItem, SortableList } from "components/Sortable";
import Icon from "components/Icon";
import Link from "components/Link";

// Minification returns empty object from dynamic import.
import json from "./shortcuts.json";
import "./shortcuts.css";

type Item = {
  id: string;
  title: string,
  iconPath: string,
  url: string,
  hidden?: boolean,
}

export default function Shortcuts({ locale }) {
  const [items, setItems] = useState<Item[]>(null);
  const [editEnabled, setEditEnabled] = useState(false);
  const [activeDragId, setActiveDragId] = useState(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    let shortcuts = await chromeStorage.get("shortcuts");

    if (!shortcuts?.length) {
      shortcuts = json.shortcuts;
    }
    setItems(shortcuts.map(item => {
      item.id = crypto.randomUUID();
      item.iconPath ??= getFaviconURL(item.url);
      return item;
    }));
  }

  function getFaviconURL(url: string) {
    const { href } = new URL(url);
    return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${href}&size=48`;
  }

  function toggleEditMode() {
    setEditEnabled(!editEnabled);
  }

  function handleSort(items: Item[]) {
    if (items) {
      setItems(items);
      saveItems(items);
    }
    setActiveDragId(null);
  }

  function handleDragStart(event) {
    setActiveDragId(event.active.id);
  }

  function toggleItemVisibility(id: string) {
    setItems(items.map(item => {
      if (item.id === id) {
        item.hidden = !item.hidden;
      }
      return item;
    }));
    saveItems(items);
  }

  function saveItems(items: Item[]) {
    chromeStorage.set({ shortcuts: structuredClone(items).map(item => {
      delete item.id;

      if (item.iconPath.startsWith("chrome")) {
        delete item.iconPath;
      }
      return item;
    }) });
  }

  if (!items) {
    return null;
  }
  else if (editEnabled) {
    return (
      <>
        <ul className={`shortcuts-items${editEnabled ? " editing" : ""}`}>
          <SortableList
            items={items}
            axis="xy"
            handleSort={handleSort}
            handleDragStart={handleDragStart}>
            {items.map(item => (
              <SortableItem className={`shortcuts-item${item.hidden ? " hidden" : ""}${item.id === activeDragId ? " dragging" : ""}`} key={item.url} id={item.id}>
                <button className="btn icon-btn shortcuts-item-toggle-btn" title={item.hidden ? locale.global.show : locale.global.hide}
                  onClick={() => toggleItemVisibility(item.id)}>
                  <Icon id={item.hidden ? "eye" : "eye-off"}/>
                </button>
                <img src={item.iconPath} className="shortcuts-item-icon" width="48px" height="48px" loading="lazy" alt=""/>
                <div className="shortcuts-item-title">{item.title}</div>
              </SortableItem>
            ))}
          </SortableList>
        </ul>
        <button className="btn icon-btn shortcuts-edit-toggle-btn" onClick={toggleEditMode} title={locale.global.edit}>
          <Icon id="edit"/>
        </button>
      </>
    );
  }
  return (
    <>
      <ul className="shortcuts-items">
        {items.map(item => item.hidden ? null : (
          <li key={item.url}>
            <Link href={item.url} className="btn icon-btn shortcuts-item">
              <img src={item.iconPath} className="shortcuts-item-icon" width="48px" height="48px" loading="lazy" alt=""/>
              <div className="shortcuts-item-title">{item.title}</div>
            </Link>
          </li>
        ))}
      </ul>
      <button className="btn icon-btn shortcuts-edit-toggle-btn" onClick={toggleEditMode} title={locale.global.edit}>
        <Icon id="edit"/>
      </button>
    </>
  );
}
