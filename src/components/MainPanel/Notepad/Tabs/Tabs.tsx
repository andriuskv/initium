import type { DragStartEvent } from "@dnd-kit/core";
import type { TabType } from "../notepad.type";
import { useState, useEffect, type FormEvent, type CSSProperties } from "react";
import { getRandomString } from "utils";
import { useModal } from "hooks";
import * as chromeStorage from "services/chromeStorage";
import { SortableItem, SortableList } from "components/Sortable";
import Dropdown from "components/Dropdown";
import Icon from "components/Icon";
import CreateButton from "components/CreateButton";
import "./tabs.css";
import Tab from "./Tab";
import TabsModal from "./TabsModal";

type Props = {
  tabs: TabType[],
  textSize: number,
  locale: any,
  selectListTab: (index: number) => void,
  updateTabs: (tabs: TabType[], shouldSave?: boolean) => void,
  updateTab: (tab: TabType, shouldSave?: boolean) => void,
  updateTabPosition: (index: number) => void,
  getTabSize: (tab: TabType) => { sizeString: string; size: number },
  decreaseTextSize: (size: number, tab?: TabType) => void,
  increaseTextSize: (size: number, tab?: TabType) => void,
  hide: () => void
}

export default function Tabs({ tabs, textSize, locale, selectListTab, updateTabs, updateTab, updateTabPosition, getTabSize, decreaseTextSize, increaseTextSize, hide }: Props) {
  const { modal, setModal, hiding: modalHiding, hideModal } = useModal();
  const [storage, setStorage] = useState({ usedFormated: "0 kb", usedRatio: 0, maxFormated: "0 kb" });
  const [activeDragId, setActiveDragId] = useState("");

  useEffect(() => {
    updateStorage();
  }, [tabs]);

  async function downloadTabs() {
    const [{ default: saveAs }, { default: JSZip }] = await Promise.all([
      import("file-saver"),
      import("jszip")
    ]);
    const zip = new JSZip();

    for (const tab of tabs) {
      zip.file(`${tab.title}.txt`, tab.content);
    }
    const archive = await zip.generateAsync({ type: "blob" });
    saveAs(archive, "notepad.zip");
  }

  function showCreateTabForm() {
    setModal({ type: "create" });
  }

  function showRemoveModal(index: number) {
    const tab = tabs[index];

    if (tab.content) {
      setModal({ type: "remove", index });
    }
    else {
      removeTab(index);
    }
  }

  function confirmTabRemoval() {
    if (modal) {
      removeTab(modal.index);
    }
    hideModal();
  }

  function removeTab(index: number) {
    updateTabPosition(0);
    updateTabs(tabs.toSpliced(index, 1));
  }

  function getNewTabTitle() {
    let number = 1;

    for (const tab of tabs) {
      const match = tab.title.match(/Tab (\d)/);

      if (match) {
        const n = Number(match[1]);

        if (n >= number) {
          number = n + 1;
        }
      }
    }

    return `Tab ${number}`;
  }

  function createTab(event: FormEvent) {
    interface FormElements extends HTMLFormControlsCollection {
      title: HTMLInputElement;
    }

    const formElement = event.target as HTMLFormElement;
    const elements = formElement.elements as FormElements;
    const tab = {
      id: getRandomString(),
      title : elements.title.value.trim() || getNewTabTitle(),
      content: ""
    };

    event.preventDefault();

    updateTabPosition(tabs.length);
    updateTabs([
      ...tabs,
      {
        ...tab,
        sizeString: getTabSize(tab).sizeString
      }
    ]);
    hideModal();
  }

  async function updateStorage() {
    const { usedFormated, usedRatio, maxFormated } = await chromeStorage.getBytesInUse("notepad");

    setStorage({ usedFormated, usedRatio, maxFormated });
  }

  function handleSort(items: unknown[] | null) {
    if (items) {
      updateTabs(items as TabType[]);
    }
    setActiveDragId("");
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
  }

  function renderTab(tab: TabType, index: number) {
    const component = {
      Component: Tab,
      params: {
        index,
        tab,
        canRemove: tabs.length > 1,
        textSize: tab.textSize || textSize,
        locale,
        updateTab,
        decreaseTextSize,
        increaseTextSize,
        selectListTab,
        showRemoveModal
      }
    };

    return (
      <SortableItem className={`notepad-tabs-item${tab.id === activeDragId ? " dragging" : ""}`}
        component={component} id={tab.id} key={tab.id} handleTitle={locale.global.drag}/>
    );
  }

  return (
    <div className="notepad">
      <div className="container-header notepad-tabs-header">
        <h2 className="container-header-title">{locale.notepad.tabs_title}</h2>
        <Dropdown>
          <div className="dropdown-group notepad-tabs-dropdown-setting-group">
            <div className="notepad-tabs-dropdown-setting-title">{locale.global.text_size_title}</div>
            <div className="notepad-tabs-dropdown-setting">
              <button className="btn icon-btn notepad-tabs-dropdown-setting-btn"
                onClick={() => decreaseTextSize(textSize)} title={locale.global.decrease_size_title} disabled={textSize <= 10}>
                <Icon id="minus"/>
              </button>
              <span className="notepad-tabs-dropdown-setting-value">{textSize}px</span>
              <button className="btn icon-btn notepad-tabs-dropdown-setting-btn"
                onClick={() => increaseTextSize(textSize)} title={locale.global.increase_size_title} disabled={textSize >= 32}>
                <Icon id="plus"/>
              </button>
            </div>
          </div>
          <button className="btn icon-text-btn dropdown-btn" onClick={downloadTabs}>
            <Icon id="download"/>
            <span>{locale.notepad.download_all_button}</span>
          </button>
        </Dropdown>
        <button className="btn icon-btn" onClick={hide} title={locale.global.close}>
          <Icon id="cross"/>
        </button>
      </div>
      <ul className="container-body notepad-tabs-items" data-dropdown-parent>
        <SortableList
          items={tabs}
          axis="xy"
          handleSort={handleSort}
          handleDragStart={handleDragStart}>
          {tabs.map((tab, index) => renderTab(tab, index))}
        </SortableList>
      </ul>
      <CreateButton style={{ "--bottom": "50px" } as CSSProperties}
        onClick={showCreateTabForm} shiftTarget=".js-notepad-tab-dropdown-toggle-btn" trackScroll></CreateButton>
      <div className="container-footer notepad-storage">
        <div className="notepad-storage-text">
          <div>{storage.usedFormated}</div>
          <div>{storage.maxFormated}</div>
        </div>
        <div className="notepad-storage-bar">
          <div className={`notepad-storage-bar-inner${storage.usedRatio > 0.9 ? " full" : ""}`}
            style={{ "--used": storage.usedRatio } as CSSProperties}>
          </div>
        </div>
      </div>
      {modal && <TabsModal locale={locale} modal={modal} hiding={modalHiding}
        hide={hideModal} confirmTabRemoval={confirmTabRemoval} createTab={createTab}/>}
    </div>
  );
}
