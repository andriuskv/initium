import type { TabType } from "../../notepad.type";
import type { FocusEvent, KeyboardEvent, MouseEvent, PropsWithChildren } from "react";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import "./tab.css";

type Props = PropsWithChildren & {
  index: number,
  tab: TabType,
  canRemove: boolean,
  textSize: number,
  locale: any,
  updateTab: (tab: TabType, shouldSave?: boolean) => void,
  selectListTab: (index: number) => void,
  showRemoveModal: (index: number) => void,
  decreaseTextSize: (size: number, tab: TabType) => void,
  increaseTextSize: (size: number, tab: TabType) => void,
}

export default function Tab({ children, index, tab, canRemove, textSize, locale, updateTab, selectListTab, showRemoveModal, decreaseTextSize, increaseTextSize }: Props) {
  function enableTabRename() {
    updateTab({
      ...tab,
      renameEnabled: true,
    }, false);
  }

  function renameTab(event: FocusEvent) {
    const newTitle = (event.target as HTMLInputElement).value;
    let shouldSave = false;
    const newTab = {
      ...tab,
      renameEnabled: undefined
    };

    if (newTitle && newTitle !== tab.title) {
      newTab.title = newTitle;
      shouldSave = true;
    }
    updateTab(newTab, shouldSave);
  }

  function downloadTab(event: MouseEvent) {
    const data = new Blob([tab.content], { type: "text/plain" });
    const url = URL.createObjectURL(data);
    const target = event.currentTarget as HTMLAnchorElement;
    target.href = url;

    setTimeout(() => {
      target.href = "";
      URL.revokeObjectURL(url);
    }, 100);
  }

  function blurTabTitleInput(event: KeyboardEvent) {
    if (event.key === "Enter") {
      (event.target as HTMLInputElement).blur();
    }
  }

  return (
    <>
      {tab.renameEnabled ? (
        <div className="notepad-tabs-item-top">
          <input type="text" className="input" autoFocus defaultValue={tab.title}
            onBlur={renameTab} onKeyDown={e => e.stopPropagation()} onKeyUp={blurTabTitleInput}/>
        </div>
      ) : (
        <div className="notepad-tabs-item-top">
          <button className="btn text-btn notepad-tabs-item-select-btn" onClick={() => selectListTab(index)}>
            <span className="notepad-tabs-item-title">{tab.title}</span>
          </button>
          {children}
        </div>
      )}
      <div className="notepad-tabs-item-bottom">
        <span className="notepad-tab-size-text">{locale.notepad.tab_size_label}: {tab.sizeString}</span>
        <Dropdown toggle={{ className: "js-notepad-tab-dropdown-toggle-btn" }}>
          <div className="dropdown-group notepad-tabs-dropdown-setting-group">
            <div className="notepad-tabs-dropdown-setting-title">{locale.global.text_size_title}</div>
            <div className="notepad-tabs-dropdown-setting">
              <button className="btn icon-btn notepad-tabs-dropdown-setting-btn"
                onClick={() => decreaseTextSize(textSize, tab)} title={locale.global.decreate_size_title} disabled={textSize <= 10}>
                <Icon id="minus"/>
              </button>
              <span className="notepad-tabs-dropdown-setting-value">{textSize}px</span>
              <button className="btn icon-btn notepad-tabs-dropdown-setting-btn"
                onClick={() => increaseTextSize(textSize, tab)} title={locale.global.increase_size_title} disabled={textSize >= 32}>
                <Icon id="plus"/>
              </button>
            </div>
          </div>
          <button className="btn icon-text-btn dropdown-btn" onClick={enableTabRename}>
            <Icon id="edit"/>
            <span>{locale.global.rename}</span>
          </button>
          <a href="" download={`${tab.title}.txt`} className="btn icon-text-btn dropdown-btn"
            onClick={downloadTab}>
            <Icon id="download"/>
            <span>{locale.global.download}</span>
          </a>
          {canRemove && (
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
