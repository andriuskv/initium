import { useState, useEffect } from "react";
import { getRandomString, formatBytes } from "utils";
import * as chromeStorage from "services/chromeStorage";
import { SortableItem, SortableList } from "components/Sortable";
import Dropdown from "components/Dropdown";
import Modal from "components/Modal";
import Icon from "components/Icon";
import CreateButton from "components/CreateButton";
import "./tabs.css";
import Tab from "./Tab";

export default function Tabs({ tabs, textSize, locale, selectListTab, updateTabs, updateTabPosition, getTabSize, decreaseTextSize, increaseTextSize, hide }) {
  const [modal, setModal] = useState(null);
  const [storage, setStorage] = useState({ current: 0, used: 0 });
  const [activeDragId, setActiveDragId] = useState(null);

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

  function hideModal() {
    setModal(null);
  }

  function showCreateTabForm() {
    setModal({ type: "create" });
  }

  function showRemoveModal(index) {
    const tab = tabs[index];

    if (tab.content) {
      setModal({ type: "remove", index });
    }
    else {
      removeTab(index);
    }
  }

  function confirmTabRemoval() {
    removeTab(modal.index);
    hideModal();
  }

  function removeTab(index) {
    tabs.splice(index, 1);
    updateTabPosition(0);
    updateTabs(tabs);
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

  function createTab(event) {
    const tab = {
      title : event.target.elements.title.value.trim() || getNewTabTitle(),
      content: ""
    };

    event.preventDefault();
    tabs.push({
      ...tab,
      id: getRandomString(),
      sizeString: getTabSize(tab).sizeString
    });
    updateTabPosition(tabs.length - 1);
    updateTabs(tabs);
    hideModal();
  }

  async function updateStorage() {
    const bytes = await chromeStorage.getBytesInUse("notepad");
    const maxBytes = 8192;

    setStorage({
      current: formatBytes(bytes),
      used: bytes / maxBytes
    });
  }

  function handleSort(items) {
    if (items) {
      updateTabs(items);
    }
    setActiveDragId(null);
  }

  function handleDragStart(event) {
    setActiveDragId(event.active.id);
  }

  function renderModal() {
    if (modal.type === "create") {
      return (
        <Modal className="notepad-modal" hide={hideModal}>
          <form onSubmit={createTab}>
            <h4 className="modal-title modal-title-center">{locale.notepad.create_modal_title}</h4>
            <input type="text" className="input" name="title"
              autoComplete="off"
              placeholder="Tab title"/>
            <div className="modal-actions">
              <button type="button" className="btn text-btn" onClick={hideModal}>{locale.global.cancel}</button>
              <button className="btn">{locale.global.create}</button>
            </div>
          </form>
        </Modal>
      );
    }
    else if (modal.type === "remove") {
      return (
        <Modal className="notepad-modal" hide={hideModal}>
          <h4 className="modal-title">{locale.notepad.remove_modal_title}</h4>
          <div className="modal-text-body">
            <p>{locale.notepad.remove_modal_text}</p>
          </div>
          <div className="modal-actions">
            <button className="btn text-btn" onClick={hideModal}>{locale.global.cancel}</button>
            <button className="btn" onClick={confirmTabRemoval}>{locale.global.remove}</button>
          </div>
        </Modal>
      );
    }
    return null;
  }

  function renderTab(tab, index) {
    const component = {
      Component: Tab,
      params: {
        index,
        tab,
        tabs,
        textSize,
        locale,
        updateTabs,
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
      <CreateButton style={{ "--bottom": "50px" }} onClick={showCreateTabForm} trackScroll></CreateButton>
      <div className="container-footer notepad-storage">
        <div className="notepad-storage-text">
          <div>{storage.current} kB</div>
          <div>8 kB</div>
        </div>
        <div className="notepad-storage-bar">
          <div className={`notepad-storage-bar-inner${storage.used > 0.9 ? " full" : ""}`}
            style={{ "--used": storage.used }}>
          </div>
        </div>
      </div>
      {modal && renderModal()}
    </div>
  );
}
