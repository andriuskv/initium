import type { Item } from "./shortcuts.type";
import type { DragStartEvent } from "@dnd-kit/core";
import { getFaviconURL } from "utils";
import { useState, useEffect } from "react";
import * as chromeStorage from "services/chromeStorage";
import { SortableItem, SortableList } from "components/Sortable";
import Icon from "components/Icon";
import Link from "components/Link";
import Form from "./Form";
import "./shortcuts.css";

export default function Shortcuts({ locale } : { locale: any }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [editEnabled, setEditEnabled] = useState(false);
  const [activeDragId, setActiveDragId] = useState("");
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    let shortcuts = await chromeStorage.get("shortcuts") as Item[] | null;

    if (!shortcuts?.length) {
      const json = await import("./shortcuts.json", { assert: { type: "json" } });
      shortcuts = json.shortcuts as Item[];
    }
    setItems(shortcuts.map(item => {
      item.id = crypto.randomUUID();
      item.iconPath ??= getFaviconURL(item.url, 48);
      return item;
    }));
  }

  function toggleEditMode() {
    setEditEnabled(!editEnabled);
  }

  function handleSort(items: unknown[] | null) {
    if (items) {
      setItems(items as Item[]);
      saveItems(items as Item[]);
    }
    setActiveDragId("");
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
  }

  function toggleItemVisibility(id: string) {
    if (!items) {
      return;
    }
    setItems(items.map(item => {
      if (item.id === id) {
        item.hidden = !item.hidden;
      }
      return item;
    }));
    saveItems(items);
  }

  function showForm() {
    setFormVisible(true);
  }

  function hideForm() {
    setFormVisible(false);
  }

  function addItem(item: Item) {
    if (!items) {
      return;
    }
    const newItems = [{
      ...item,
      id: crypto.randomUUID(),
      iconPath: getFaviconURL(item.url, 48),
      custom: true
    }, ...items];

    setItems(newItems);
    saveItems(newItems);
  }

  function removeItem(id: string) {
    if (!items) {
      return;
    }
    const newItems = items.filter(item => item.id !== id);

    setItems(newItems);
    saveItems(newItems);
  }

  function saveItems(items: Partial<Item>[]) {
    chromeStorage.set({ shortcuts: structuredClone(items).map(item => {
      delete item.id;

      if (item.iconPath?.startsWith("chrome")) {
        delete item.iconPath;
      }
      return item;
    }) });
  }

  if (!items) {
    return null;
  }
  return (
    <>
      {formVisible ? (
        <Form locale={locale} addItem={addItem} hide={hideForm}/>
      ) : editEnabled ? (
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
                {item.custom ? (
                  <button className="btn icon-btn shortcuts-item-remove-btn" title={locale.global.remove}
                    onClick={() => removeItem(item.id)}>
                    <Icon id={"trash"}/>
                  </button>
                ) : null}
                <img src={item.iconPath} className="shortcuts-item-icon" width="48px" height="48px" loading="lazy" alt=""/>
                <div className="shortcuts-item-title">{item.title}</div>
              </SortableItem>
            ))}
          </SortableList>
        </ul>
      ) : (
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
      )}
      {formVisible ? null : (
        <>
          <button className="btn icon-btn shortcuts-add-btn" onClick={showForm} title={locale.global.add}>
            <Icon id="plus"/>
          </button>
          <button className="btn icon-btn shortcuts-edit-toggle-btn" onClick={toggleEditMode} title={locale.global.edit}>
            <Icon id="edit"/>
          </button>
        </>
      )}
    </>
  );
}
