import { useState, useEffect } from "react";
import { getRandomString, formatBytes } from "utils";
import * as chromeStorage from "services/chromeStorage";
import { SortableItem, SortableList } from "components/Sortable";
import Dropdown from "components/Dropdown";
import Modal from "components/Modal";
import Icon from "components/Icon";
import CreateButton from "components/CreateButton";
import "./tabs.css";

export default function Tabs({ tabs, textSize, selectListTab, updateTabs, updateTabPosition, getTabSize, decreaseTextSize, increaseTextSize, hide }) {
  const [modal, setModal] = useState(null);
  const [storage, setStorage] = useState({ current: 0, used: 0 });
  const [activeDragId, setActiveDragId] = useState(null);

  useEffect(() => {
    updateStorage();
  }, [tabs]);

  function enableTabRename(tab) {
    tab.renameEnabled = true;
    updateTabs(tabs, false);
  }

  function renameTab(event, tab) {
    const newTitle = event.target.value;
    let shouldSave = false;

    delete tab.renameEnabled;

    if (newTitle && newTitle !== tab.title) {
      tab.title = newTitle;
      shouldSave = true;
    }
    updateTabs(tabs, shouldSave);
  }

  function downloadTab(event, index) {
    const { content } = tabs[index];
    const data = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(data);
    const target = event.currentTarget;
    target.href = url;

    setTimeout(() => {
      target.href = "";
      URL.revokeObjectURL(url);
    }, 100);
  }

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

  function blurTabTitleInput(event) {
    if (event.key === "Enter") {
      event.target.blur();
    }
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

  function renderTextSizeSetting(tab) {
    let size = textSize;

    if (tab?.textSize) {
      size = tab.textSize;
    }

    return (
      <div className="dropdown-group notepad-tabs-dropdown-setting-group">
        <div className="notepad-tabs-dropdown-setting-title">Text size</div>
        <div className="notepad-tabs-dropdown-setting">
          <button className="btn icon-btn notepad-tabs-dropdown-setting-btn"
            onClick={() => decreaseTextSize(size, tab)} title="Decrease text size" disabled={size <= 10}>
            <Icon id="minus"/>
          </button>
          <span className="notepad-tabs-dropdown-setting-value">{size}px</span>
          <button className="btn icon-btn notepad-tabs-dropdown-setting-btn"
            onClick={() => increaseTextSize(size, tab)} title="Increase text size" disabled={size >= 32}>
            <Icon id="plus"/>
          </button>
        </div>
      </div>
    );
  }

  function renderModal() {
    if (modal.type === "create") {
      return (
        <Modal className="notepad-modal" hide={hideModal}>
          <form onSubmit={createTab}>
            <h4 className="modal-title modal-title-center">Create Tab</h4>
            <input type="text" className="input" name="title"
              autoComplete="off"
              placeholder="Tab title"/>
            <div className="modal-actions">
              <button type="button" className="btn text-btn" onClick={hideModal}>Cancel</button>
              <button className="btn">Create</button>
            </div>
          </form>
        </Modal>
      );
    }
    else if (modal.type === "remove") {
      return (
        <Modal className="notepad-modal" hide={hideModal}>
          <h4 className="modal-title">Remove tab</h4>
          <div className="modal-text-body">
            <p>Do you want to remove this tab?</p>
          </div>
          <div className="modal-actions">
            <button className="btn text-btn" onClick={hideModal}>Cancel</button>
            <button className="btn" onClick={confirmTabRemoval}>Remove</button>
          </div>
        </Modal>
      );
    }
    return null;
  }

  return (
    <div className="notepad">
      <div className="notepad-tabs-header">
        <h2 className="notepad-tabs-header-title">Notepad Tabs</h2>
        <Dropdown>
          {renderTextSizeSetting()}
          <button className="btn icon-text-btn dropdown-btn" onClick={downloadTabs}>
            <Icon id="download"/>
            <span>Download all</span>
          </button>
        </Dropdown>
        <button className="btn icon-btn" onClick={hide} title="Close">
          <Icon id="cross"/>
        </button>
      </div>
      <ul className="notepad-tabs-items" data-dropdown-parent>
        <SortableList
          items={tabs}
          axis="xy"
          handleSort={handleSort}
          handleDragStart={handleDragStart}>
          {tabs.map((tab, index) => (
            <SortableItem className={`notepad-tabs-item${tab.id === activeDragId ? " dragging" : ""}`}
              key={tab.id} id={tab.id} handle={{ className: "notepad-tabs-item-handle" }}>
              {tab.renameEnabled ? (
                <input type="text" className="input" autoFocus defaultValue={tab.title}
                  onBlur={event => renameTab(event, tab)} onKeyDown={e => e.stopPropagation()} onKeyPress={blurTabTitleInput}/>
              ) : (
                <button className="btn text-btn notepad-tabs-item-title" onClick={() => selectListTab(index)}>
                  <span className="notepad-tabs-item-title-text">{tab.title}</span>
                </button>
              )}
              <div className="notepad-tabs-item-bottom">
                <span className="notepad-tab-size-text">Size: {tab.sizeString} kB</span>
                <Dropdown>
                  {renderTextSizeSetting(tab)}
                  <button className="btn icon-text-btn dropdown-btn" onClick={() => enableTabRename(tab)}>
                    <Icon id="edit"/>
                    <span>Rename</span>
                  </button>
                  <a href="" download={`${tab.title}.txt`} className="btn icon-text-btn dropdown-btn"
                    onClick={event => downloadTab(event, index)}>
                    <Icon id="download"/>
                    <span>Download</span>
                  </a>
                  {tabs.length > 1 && (
                    <button className="btn icon-text-btn dropdown-btn" onClick={() => showRemoveModal(index)}>
                      <Icon id="trash"/>
                      <span>Remove</span>
                    </button>
                  )}
                </Dropdown>
              </div>
            </SortableItem>
          ))}
        </SortableList>
      </ul>
      <CreateButton style={{ "--bottom": "50px" }} onClick={showCreateTabForm} trackScroll></CreateButton>
      <div className="notepad-storage">
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
