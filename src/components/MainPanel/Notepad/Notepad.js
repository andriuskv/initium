import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { getRandomString, formatBytes } from "utils";
import * as chromeStorage from "services/chromeStorage";
import { getSetting } from "services/settings";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import "./notepad.css";

const Tabs = lazy(() => import("./Tabs"));

export default function Notepad() {
  const [tabs, setTabs] = useState(null);
  const [{ activeIndex, shift }, setNavigation] = useState(() => ({ activeIndex: 0, shift: 0 }));
  const [tabListVisible, setTabListVisible] = useState(false);
  const [storageWarning, setStorageWarning] = useState(null);
  const [textSize, setTextSize] = useState(() => {
    const { textSize } = getSetting("notepad");
    return textSize ?? 14;
  });
  const saveTimeoutId = useRef(0);
  const textareaRef = useRef(0);
  const VISIBLE_ITEM_COUNT = 3;

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!tabListVisible && tabs) {
      const element = textareaRef.current;

      element.focus();
      element.selectionStart = element.value.length;
    }
  }, [tabListVisible]);

  async function init() {
    let notepad = await chromeStorage.get("notepad");

    if (notepad?.length) {
      notepad = notepad.map(tab => {
        tab.id = getRandomString();
        tab.sizeString = getTabSize(tab).sizeString;
        return tab;
      });
    }
    else {
      notepad = [getDefaultTab()];
    }
    setTabs(notepad);
    checkStorageSize();

    chromeStorage.subscribeToChanges(({ notepad }) => {
      if (!notepad) {
        return;
      }

      if (notepad.newValue) {
        setTabs(notepad.newValue.map(tab => {
          tab.id = getRandomString();
          return tab;
        }));
      }
      else {
        setNavigation({ activeIndex: 0, shift: 0 });
        setTabs([getDefaultTab()]);
      }
    });
  }

  function getDefaultTab() {
    const tab = {
      title: "Tab",
      content: ""
    };
    return {
      ...tab,
      id: getRandomString(),
      sizeString: getTabSize(tab).sizeString
    };
  }

  function previousShift() {
    const newShift = shift - 1;

    setNavigation({
      activeIndex: activeIndex >= newShift + VISIBLE_ITEM_COUNT ? activeIndex - 1 : activeIndex,
      shift: newShift
    });
  }

  function nextShift() {
    const newShift = shift + 1;

    setNavigation({
      activeIndex: activeIndex < newShift ? activeIndex + 1 : activeIndex,
      shift: newShift
    });
  }

  function selectTab(index) {
    setNavigation({
      activeIndex: index,
      shift
    });
  }

  function showTabList() {
    setTabListVisible(true);
  }

  function hideTabList() {
    setTabListVisible(false);
  }

  async function checkStorageSize() {
    /* global chrome */
    if (chrome.runtime.lastError?.message.startsWith("QUOTA_BYTES_PER_ITEM")) {
      setStorageWarning({
        full: true,
        message: "Storage is full, no additional data will be saved."
      });
    }
    else {
      const bytes = await chromeStorage.getBytesInUse("notepad");
      const maxBytes = 8192;

      if (bytes / maxBytes * 100 >= 90) {
        setStorageWarning({ message: "Storage is almost full." });
      }
      else {
        setStorageWarning(null);
      }
    }
  }

  function dismissWarning() {
    storageWarning.hidden = true;
    setStorageWarning({ ...storageWarning });
  }

  function getTabSize(tab) {
    const { size } = new Blob([JSON.stringify({ title: tab.title, content: tab.content })]);

    return {
      size,
      sizeString: formatBytes(size)
    };
  }

  function handleTextareaChange({ target }) {
    const tab = tabs[activeIndex];
    const { value } = target;
    tab.content = value;

    clearTimeout(saveTimeoutId.current);
    saveTimeoutId.current = setTimeout(() => {
      tab.sizeString = getTabSize(tab).sizeString;
      updateTabs(tabs);
    }, 400);
  }

  function selectListTab(index) {
    let newShift = shift;

    if (index < shift || index >= shift + VISIBLE_ITEM_COUNT) {
      newShift = index > tabs.length - VISIBLE_ITEM_COUNT ? tabs.length - VISIBLE_ITEM_COUNT : index;
    }
    setNavigation({
      activeIndex: index,
      shift: newShift
    });
    hideTabList();
  }

  function updateTabs(tabs, shouldSave = true) {
    setTabs([...tabs]);

    if (shouldSave) {
      saveTabs(tabs);
    }
  }

  function updateTabPosition(index) {
    setNavigation({
      activeIndex: index,
      shift: index + 1 - VISIBLE_ITEM_COUNT < 0 ? 0 : index + 1 - VISIBLE_ITEM_COUNT
    });
  }

  async function saveTabs(tabs) {
    chromeStorage.set({ notepad: tabs.map(tab => ({
      title: tab.title,
      content: tab.content
    })) }, () => {
      checkStorageSize();
    });
  }

  function renderWarning() {
    if (storageWarning.hidden) {
      return null;
    }
    else if (storageWarning.full) {
      return (
        <div className="container notepad-warning">
          <p>{storageWarning.message}</p>
          <button className="btn icon-btn" onClick={dismissWarning} title="Dismiss">
            <Icon id="cross"/>
          </button>
        </div>
      );
    }
    return (
      <Dropdown
        container={{ className: "notepad-warning-dropdown-container" }}
        toggle={{ title: "Show warning", iconId: "warning" }}
        body={{ className: "notepad-warning-dropdown" }}>
        <p>{storageWarning.message}</p>
      </Dropdown>
    );
  }

  if (!tabs) {
    return null;
  }
  else if (tabListVisible) {
    return (
      <Suspense fallback={null}>
        <Tabs tabs={tabs} textSize={textSize} selectListTab={selectListTab} updateTabs={updateTabs} updateTabPosition={updateTabPosition}
          getTabSize={getTabSize} setTextSize={setTextSize} hide={hideTabList}/>
      </Suspense>
    );
  }
  return (
    <div className="notepad">
      <div className="main-panel-item-header">
        {tabs.length > VISIBLE_ITEM_COUNT && (
          <button className="btn icon-btn main-panel-item-header-btn" onClick={previousShift} disabled={shift <= 0}>
            <Icon id="chevron-left"/>
          </button>
        )}
        <ul className="main-panel-item-header-items">
          {tabs.map((tab, i) => (
            <li className={`main-panel-item-header-item${activeIndex === i ? " active" : ""}${i < shift || i >= shift + VISIBLE_ITEM_COUNT ? " hidden" : ""}`} key={tab.id}>
              <button className="btn text-btn main-panel-item-header-item-select-btn" onClick={() => selectTab(i)}>
                <span className="main-panel-item-header-item-title">{tab.title}</span>
              </button>
            </li>
          ))}
        </ul>
        {tabs.length > VISIBLE_ITEM_COUNT && (
          <button className="btn icon-btn main-panel-item-header-btn" onClick={nextShift}
            disabled={shift + VISIBLE_ITEM_COUNT >= tabs.length}>
            <Icon id="chevron-right"/>
          </button>
        )}
        <div className="main-panel-item-header-separator"></div>
        <button className="btn icon-btn main-panel-item-header-btn" onClick={showTabList} title="Show tabs">
          <Icon id="menu"/>
        </button>
      </div>
      {storageWarning && renderWarning()}
      <textarea className="notepad-input" ref={textareaRef} style={{ "--text-size": `${textSize}px` }}
        onChange={handleTextareaChange}
        defaultValue={tabs[activeIndex].content}
        key={tabs[activeIndex].id}>
      </textarea>
    </div>
  );
}
