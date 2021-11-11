import { useState } from "react";
import { getRandomString } from "utils";
import { SortableItem, SortableList } from "services/sortable";
import Dropdown from "components/Dropdown";
import Modal from "components/Modal";
import Icon from "components/Icon";
import "./tabs.css";

export default function Tabs({ tabs, selectListTab, updateTabs, updateTabPosition, hide }) {
  const [modal, setModal] = useState(null);

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

  function createTab(event) {
    event.preventDefault();
    tabs.push({
      id: getRandomString(4),
      title : event.target.elements.title.value.trim() || "Tab",
      content: ""
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

  function renderModal() {
    if (modal.type === "create") {
      return (
        <Modal className="notepad-modal">
          <form onSubmit={createTab}>
            <h4 className="modal-title notepad-create-tab-modal-title">Create Tab</h4>
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
        <Modal className="notepad-modal">
          <h4 className="modal-title">Remove tab?</h4>
          <p>Do you want to remove this tab?</p>
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
        <button className="btn icon-btn" onClick={showCreateTabForm} title="Create tab">
          <Icon id="plus"/>
        </button>
        <button className="btn icon-btn" onClick={hide} title="Close">
          <Icon id="cross"/>
        </button>
      </div>
      <SortableList items={tabs} handleSort={updateTabs}>
        <ul className="notepad-tabs-items" data-dropdown-parent>
          {tabs.map((tab, index) => (
            <SortableItem key={tab.id} index={index}>
              <li className="notepad-tabs-item" key={tab.id}>
                {tab.renameEnabled ? (
                  <input type="text" className="input" autoFocus defaultValue={tab.title}
                    onBlur={event => renameTab(event, tab)} onKeyPress={blurTabTitleInput}/>
                ) : (
                  <>
                    <button className="btn text-btn notepad-tabs-item-title" onClick={() => selectListTab(index)}>{tab.title}</button>
                    <Dropdown>
                      <button className="btn icon-text-btn dropdown-btn" onClick={() => enableTabRename(tab)}>
                        <Icon id="edit"/>
                        <span>Rename</span>
                      </button>
                      <a download={`${tab.title}.txt`} className="btn icon-text-btn dropdown-btn"
                        onClick={event => downloadTab(event, index)} title="Download">
                        <Icon id="download"/>
                        <span>Download</span>
                      </a>
                      {tabs.length > 1 && (
                        <button className="btn icon-text-btn dropdown-btn" onClick={() => showRemoveModal(index)} title="Remove">
                          <Icon id="trash"/>
                          <span>Remove</span>
                        </button>
                      )}
                    </Dropdown>
                  </>
                )}
              </li>
            </SortableItem>
          ))}
        </ul>
      </SortableList>
      {modal && renderModal()}
    </div>
  );
}
