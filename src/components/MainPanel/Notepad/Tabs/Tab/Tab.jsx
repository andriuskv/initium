import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import "./tab.css";

export default function Tab({ children, index, tab, tabs, textSize, locale, updateTabs, selectListTab, showRemoveModal, decreaseTextSize, increaseTextSize }) {
  function enableTabRename() {
    tab.renameEnabled = true;
    updateTabs(tabs, false);
  }

  function renameTab(event) {
    const newTitle = event.target.value;
    let shouldSave = false;

    delete tab.renameEnabled;

    if (newTitle && newTitle !== tab.title) {
      tab.title = newTitle;
      shouldSave = true;
    }
    updateTabs(tabs, shouldSave);
  }

  function downloadTab(event) {
    const data = new Blob([tab.content], { type: "text/plain" });
    const url = URL.createObjectURL(data);
    const target = event.currentTarget;
    target.href = url;

    setTimeout(() => {
      target.href = "";
      URL.revokeObjectURL(url);
    }, 100);
  }

  function blurTabTitleInput(event) {
    if (event.key === "Enter") {
      event.target.blur();
    }
  }

  function renderTextSizeSetting() {
    let size = textSize;

    if (tab?.textSize) {
      size = tab.textSize;
    }

    return (
      <div className="dropdown-group notepad-tabs-dropdown-setting-group">
        <div className="notepad-tabs-dropdown-setting-title">{locale.global.text_size_title}</div>
        <div className="notepad-tabs-dropdown-setting">
          <button className="btn icon-btn notepad-tabs-dropdown-setting-btn"
            onClick={() => decreaseTextSize(size, tab)} title={locale.global.decreate_size_title} disabled={size <= 10}>
            <Icon id="minus"/>
          </button>
          <span className="notepad-tabs-dropdown-setting-value">{size}px</span>
          <button className="btn icon-btn notepad-tabs-dropdown-setting-btn"
            onClick={() => increaseTextSize(size, tab)} title={locale.global.increase_size_title} disabled={size >= 32}>
            <Icon id="plus"/>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {tab.renameEnabled ? (
        <input type="text" className="input" autoFocus defaultValue={tab.title}
          onBlur={renameTab} onKeyDown={e => e.stopPropagation()} onKeyUp={blurTabTitleInput}/>
      ) : (
        <div className="notepad-tabs-item-top">
          <button className="btn text-btn notepad-tabs-item-select-btn" onClick={() => selectListTab(index)}>
            <span className="notepad-tabs-item-title">{tab.title}</span>
          </button>
          {children}
        </div>
      )}
      <div className="notepad-tabs-item-bottom">
        <span className="notepad-tab-size-text">Size: {tab.sizeString} kB</span>
        <Dropdown>
          {renderTextSizeSetting()}
          <button className="btn icon-text-btn dropdown-btn" onClick={enableTabRename}>
            <Icon id="edit"/>
            <span>{locale.global.rename}</span>
          </button>
          <a href="" download={`${tab.title}.txt`} className="btn icon-text-btn dropdown-btn"
            onClick={downloadTab}>
            <Icon id="download"/>
            <span>{locale.global.download}</span>
          </a>
          {tabs.length > 1 && (
            <button className="btn icon-text-btn dropdown-btn" onClick={() => showRemoveModal(index)}>
              <Icon id="trash"/>
              <span>{locale.global.remove}</span>
            </button>
          )}
        </Dropdown>
      </div>
    </>
  );
}
