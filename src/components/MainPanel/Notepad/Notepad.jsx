import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { getRandomString, formatBytes, timeout } from "utils";
import * as chromeStorage from "services/chromeStorage";
import { getSetting, updateMainPanelComponentSetting } from "services/settings";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import Toast from "components/Toast";
import "./notepad.css";

const Tabs = lazy(() => import("./Tabs"));

export default function Notepad({ locale }) {
  const [tabs, setTabs] = useState(null);
  const [{ activeIndex, shift }, setNavigation] = useState(() => ({ activeIndex: 0, shift: 0 }));
  const [tabListVisible, setTabListVisible] = useState(false);
  const [storageWarning, setStorageWarning] = useState(null);
  const [textSize, setTextSize] = useState(() => {
    const { components: { notepad } } = getSetting("mainPanel");
    return notepad.textSize;
  });
  const [textSizeLabelVisible, setTextSizeLabelVisible] = useState(false);
  const [resetTextSize, setResetTextSize] = useState(false);
  const labelTimeoutId = useRef(0);
  const saveTimeoutId = useRef(0);
  const textareaRef = useRef(0);
  const VISIBLE_ITEM_COUNT = 3;

  useEffect(() => {
    init();

    window.addEventListener("reset-notepad-text-size", handleTextSizeReset);

    return () => {
      window.removeEventListener("reset-notepad-text-size", handleTextSizeReset);
    };
  }, []);

  useEffect(() => {
    if (resetTextSize) {
      setTextSize(14);
      setTabs(tabs.map(tab => {
        delete tab.textSize;
        return tab;
      }));
      setResetTextSize(false);
    }
  }, [resetTextSize, tabs]);

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
      notepad = initTabs(notepad);
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
        setTabs(initTabs(notepad.newValue));
      }
      else {
        setNavigation({ activeIndex: 0, shift: 0 });
        setTabs([getDefaultTab()]);
      }
    });
  }

  function initTabs(tabs) {
    const { components: { notepad: settings } } = getSetting("mainPanel");
    const settingsTabs = settings.tabs ?? [];

    return tabs.map(tab => {
      tab.id ??= getRandomString();
      tab.sizeString = getTabSize(tab).sizeString;

      const settingsTab = settingsTabs.find(({ id }) => id === tab.id);

      if (settingsTab) {
        tab.textSize = settingsTab.textSize;
      }
      return tab;
    });
  }

  function handleTextSizeReset() {
    setResetTextSize(true);
  }

  function getDefaultTab() {
    const tab = {
      title: "Tab 1",
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

    tab.content = target.value;

    saveTimeoutId.current = timeout(() => {
      tab.sizeString = getTabSize(tab).sizeString;
      updateTabs(tabs);
    }, 400, saveTimeoutId.current);
  }

  function handleTextareaKeyDown(event) {
    if (!event.ctrlKey) {
      return;
    }

    if (event.key === "=") {
      const activeTab = tabs[activeIndex];
      const size = activeTab.textSize || textSize;

      event.preventDefault();

      increaseTextSize(size, activeTab);
      showTextSizeLabel();
    }
    else if (event.key === "-") {
      const activeTab = tabs[activeIndex];
      const size = activeTab.textSize || textSize;

      event.preventDefault();

      decreaseTextSize(size, activeTab);
      showTextSizeLabel();
    }
  }

  function decreaseTextSize(textSize, tab) {
    if (textSize > 10) {
      updateTextSize(textSize - 1, tab);
    }
  }

  function increaseTextSize(textSize, tab) {
    if (textSize < 32) {
      updateTextSize(textSize + 1, tab);
    }
  }

  function updateTextSize(value, tab) {
    if (tab) {
      tab.textSize = value;
      updateTabs(tabs, false);
      saveTabTextSize(tabs);
    }
    else {
      setTextSize(value);
      saveTextSize(value);
    }
  }

  function saveTextSize(value) {
    saveTimeoutId.current = timeout(() => {
      updateMainPanelComponentSetting("notepad", { textSize: value });
    }, 1000, saveTimeoutId.current);
  }

  function saveTabTextSize(tabs) {
    saveTimeoutId.current = timeout(() => {
      updateMainPanelComponentSetting("notepad", {
        tabs: tabs.filter(tab => tab.textSize).map(tab => ({
          id: tab.id,
          textSize: tab.textSize
        }))
      });
    }, 1000, saveTimeoutId.current);
  }

  function showTextSizeLabel() {
    if (!textSizeLabelVisible) {
      setTextSizeLabelVisible(true);
    }
    labelTimeoutId.current = timeout(() => {
      setTextSizeLabelVisible(false);
    }, 1000, labelTimeoutId.current);
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

  function saveTabs(tabs) {
    saveTimeoutId.current = timeout(() => {
      saveTabTextSize(tabs);
      chromeStorage.set({ notepad: tabs.map(tab => ({
        id: tab.id,
        title: tab.title,
        content: tab.content
      })) }, () => {
        checkStorageSize();
      });
    }, 1000, saveTimeoutId.current);
  }

  function renderWarning() {
    if (storageWarning.hidden) {
      return null;
    }
    else if (storageWarning.full) {
      return <Toast message={storageWarning.message} position="bottom" locale={locale} dismiss={dismissWarning}/>;
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
        <Tabs tabs={tabs} textSize={textSize} locale={locale} selectListTab={selectListTab}
          updateTabs={updateTabs} updateTabPosition={updateTabPosition} getTabSize={getTabSize} setTextSize={setTextSize}
          decreaseTextSize={decreaseTextSize} increaseTextSize={increaseTextSize} hide={hideTabList}/>
      </Suspense>
    );
  }

  const activeTab = tabs[activeIndex];

  return (
    <div className="notepad">
      <div className="container-header main-panel-item-header">
        {tabs.length > VISIBLE_ITEM_COUNT && (
          <button className="btn icon-btn main-panel-item-header-btn" onClick={previousShift}
            aria-label={locale.mainPanel.previous_shift_title} disabled={shift <= 0}>
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
            aria-label={locale.mainPanel.next_shift_title} disabled={shift + VISIBLE_ITEM_COUNT >= tabs.length}>
            <Icon id="chevron-right"/>
          </button>
        )}
        <div className="main-panel-item-header-separator"></div>
        <button className="btn icon-btn main-panel-item-header-btn" onClick={showTabList} title={locale.notepad.show_tabs_title}>
          <Icon id="menu"/>
        </button>
      </div>
      {storageWarning && renderWarning()}
      <textarea className="container-body notepad-input" ref={textareaRef} style={{ "--text-size": `${activeTab.textSize || textSize}px` }}
        onChange={handleTextareaChange}
        onKeyDown={handleTextareaKeyDown}
        defaultValue={activeTab.content}
        key={activeTab.id}>
      </textarea>
      {textSizeLabelVisible && <div className="container notepad-text-size-label">{activeTab.textSize}px</div>}
    </div>
  );
}
