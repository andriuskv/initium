/* global chrome */

import { useState, useEffect } from "react";
import * as chromeStorage from "services/chromeStorage";
import { SortableItem, SortableList } from "components/Sortable";
import Icon from "components/Icon";

// Minification returns empty object from dynamic import.
import json from "./shortcuts.json";
import "./shortcuts.css";

export default function Shortcuts({ locale }) {
  const [items, setItems] = useState(null);
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

  function getFaviconURL(url) {
    const { href } = new URL(url);
    return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${href}&size=48`;
  }

  function toggleEditMode() {
    setEditEnabled(!editEnabled);
  }

  function handleSort(items) {
    if (items) {
      setItems(items);
      saveItems(items);
    }
    setActiveDragId(null);
  }

  function handleDragStart(event) {
    setActiveDragId(event.active.id);
  }

  function toggleItemVisibility(item) {
    item.hidden = !item.hidden;

    setItems([...items]);
    saveItems(items);
  }

  function saveItems(items) {
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
                  onClick={() => toggleItemVisibility(item)}>
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
            <a href={item.url} className="btn icon-btn shortcuts-item">
              <img src={item.iconPath} className="shortcuts-item-icon" width="48px" height="48px" loading="lazy" alt=""/>
              <div className="shortcuts-item-title">{item.title}</div>
            </a>
          </li>
        ))}
      </ul>
      <button className="btn icon-btn shortcuts-edit-toggle-btn" onClick={toggleEditMode} title={locale.global.edit}>
        <Icon id="edit"/>
      </button>
    </>
  );
}
