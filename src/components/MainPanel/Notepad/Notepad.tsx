import type { TabType } from "./notepad.type";
import type { MainPanelSettings } from "types/settings";
import { useState, useEffect, useRef, lazy, Suspense, type CSSProperties, type ChangeEvent, type KeyboardEvent } from "react";
import { getRandomString, formatBytes, timeout } from "utils";
import * as chromeStorage from "services/chromeStorage";
import { getSetting, updateMainPanelComponentSetting } from "services/settings";
import TabsContainer from "components/TabsContainer";
import Icon from "components/Icon";
import Spinner from "components/Spinner";
import "./notepad.css";
import Warning from "./Warning";

const Tabs = lazy(() => import("./Tabs"));

type Nav = {
  activeIndex: number,
  shift: number
}

const VISIBLE_ITEM_COUNT = 3;

export default function Notepad({ locale }) {
  const [tabs, setTabs] = useState<TabType[]>(null);
  const [{ activeIndex, shift }, setNavigation] = useState<Nav>(() => ({ activeIndex: 0, shift: 0 }));
  const [tabListVisible, setTabListVisible] = useState(false);
  const [storageWarning, setStorageWarning] = useState(null);
  const [textSize, setTextSize] = useState(() => {
    const { components: { notepad } } = getSetting("mainPanel") as MainPanelSettings;
    return notepad.textSize;
  });
  const [textSizeLabelVisible, setTextSizeLabelVisible] = useState(false);
  const labelTimeoutId = useRef(0);
  const saveTimeoutId = useRef(0);
  const saveTabTimeoutId = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeTab = tabs ? tabs[activeIndex] : null;

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    window.addEventListener("reset-notepad-text-size", handleTextSizeReset);

    return () => {
      window.removeEventListener("reset-notepad-text-size", handleTextSizeReset);
    };
  }, [tabs]);

  useEffect(() => {
    if (!tabListVisible && tabs) {
      const element = textareaRef.current;

      element.focus();
      element.selectionStart = element.value.length;
    }
  }, [tabListVisible]);

  async function init() {
    const saved = JSON.parse(localStorage.getItem("active-notepad-tab")) || { activeIndex: 0, shift: 0 };
    let notepad = await chromeStorage.get("notepad");

    if (notepad?.length) {
      notepad = initTabs(notepad);
    }
    else {
      notepad = [getDefaultTab()];
    }

    if (saved.activeIndex < notepad.length) {
      setNavigation(saved);
    }
    setTabs(notepad);
    checkStorageSize();

    chromeStorage.subscribeToChanges(({ notepad }) => {
      if (!notepad) {
        return;
      }
      setNavigation({ activeIndex: 0, shift: 0 });

      if (notepad.newValue) {
        setTabs(initTabs(notepad.newValue));
      }
      else {
        setTabs([getDefaultTab()]);
      }
    });
  }

  function initTabs(tabs: TabType[]) {
    const { components: { notepad: settings } } = getSetting("mainPanel") as MainPanelSettings;
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
    setTextSize(14);
    setTabs(tabs.map(tab => {
      delete tab.textSize;
      return tab;
    }));
  }

  function getDefaultTab() {
    const tab = {
      id: getRandomString(),
      title: "Tab 1",
      content: ""
    };
    return {
      ...tab,
      sizeString: getTabSize(tab).sizeString
    };
  }

  function previousShift() {
    const newShift = shift - 1;

    selectView({
      activeIndex: activeIndex >= newShift + VISIBLE_ITEM_COUNT ? activeIndex - 1 : activeIndex,
      shift: newShift
    });
  }

  function nextShift() {
    const newShift = shift + 1;

    selectView({
      activeIndex: activeIndex < newShift ? activeIndex + 1 : activeIndex,
      shift: newShift
    });
  }

  function selectTab(index: number) {
    selectView({ activeIndex: index, shift });
  }

  function showTabList() {
    setTabListVisible(true);
  }

  function hideTabList() {
    setTabListVisible(false);
  }

  async function checkStorageSize() {
    const data = await chromeStorage.checkSize("notepad");

    if (data.message) {
      setStorageWarning({
        usedRatio: data.usedRatio,
        message: data.message
      });
    }
  }

  function dismissWarning() {
    setStorageWarning({ ...storageWarning, hidden: true });
  }

  function getTabSize(tab: TabType) {
    const { size } = new Blob([JSON.stringify({ title: tab.title, content: tab.content })]);

    return {
      size,
      sizeString: formatBytes(size)
    };
  }

  function handleTextareaChange({ target }: ChangeEvent) {
    const content = (target as HTMLTextAreaElement).value;
    const tab: TabType = {
      ...activeTab,
      content
    };

    updateTab(tab, false);

    saveTimeoutId.current = timeout(() => {
      updateTab({
        ...tab,
        sizeString: getTabSize(tab).sizeString
      });
    }, 400, saveTimeoutId.current);
  }

  function handleTextareaKeyDown(event: KeyboardEvent) {
    if (!event.ctrlKey) {
      return;
    }

    if (event.key === "=") {
      const size = activeTab.textSize || textSize;

      event.preventDefault();

      increaseTextSize(size, activeTab);
      showTextSizeLabel();
    }
    else if (event.key === "-") {
      const size = activeTab.textSize || textSize;

      event.preventDefault();

      decreaseTextSize(size, activeTab);
      showTextSizeLabel();
    }
  }

  function decreaseTextSize(textSize: number, tab?: TabType) {
    if (textSize > 10) {
      updateTextSize(textSize - 1, tab);
    }
  }

  function increaseTextSize(textSize: number, tab?: TabType) {
    if (textSize < 32) {
      updateTextSize(textSize + 1, tab);
    }
  }

  function updateTextSize(value: number, tab?: TabType) {
    if (tab) {
      updateTab({
        ...tab,
        textSize: value
      }, false);
      saveTabTextSize(tabs);
    }
    else {
      setTextSize(value);
      saveTextSize(value);
    }
  }

  function saveTextSize(value: number) {
    saveTimeoutId.current = timeout(() => {
      updateMainPanelComponentSetting("notepad", { textSize: value });
    }, 1000, saveTimeoutId.current);
  }

  function saveTabTextSize(tabs: TabType[]) {
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

  function selectListTab(index: number) {
    let newShift = shift;

    if (index < shift || index >= shift + VISIBLE_ITEM_COUNT) {
      newShift = index > tabs.length - VISIBLE_ITEM_COUNT ? tabs.length - VISIBLE_ITEM_COUNT : index;
    }
    selectView({ activeIndex: index, shift: newShift });
    hideTabList();
  }

  function updateTabs(tabs: TabType[], shouldSave = true) {
    setTabs(tabs);

    if (shouldSave) {
      saveTabs(tabs);
    }
  }

  function updateTab(tab: TabType, shouldSave = true) {
    const index = tabs.findIndex(({ id }) => id === tab.id);

    updateTabs(tabs.with(index, tab), shouldSave);
  }

  function updateTabPosition(index: number) {
    selectView({
      activeIndex: index,
      shift: index + 1 - VISIBLE_ITEM_COUNT < 0 ? 0 : index + 1 - VISIBLE_ITEM_COUNT
    });
  }

  function selectView(navigation: Nav) {
    setNavigation(navigation);

    saveTabTimeoutId.current = timeout(() => {
      localStorage.setItem("active-notepad-tab", JSON.stringify(navigation));
    }, 400, saveTabTimeoutId.current);
  }

  function saveTabs(tabs: TabType[]) {
    saveTimeoutId.current = timeout(async () => {
      saveTabTextSize(tabs);
      const data = await chromeStorage.set({ notepad: tabs.map(tab => ({
        id: tab.id,
        title: tab.title,
        content: tab.content
      })) }, { warnSize: true });

      if (data?.message) {
        setStorageWarning({
          usedRatio: data.usedRatio,
          message: data.message
        });
      }
      else {
        setStorageWarning(null);
      }
    }, 1000, saveTimeoutId.current);
  }

  if (!tabs) {
    return null;
  }
  else if (tabListVisible) {
    return (
      <Suspense fallback={<Spinner size="24px"/>}>
        <Tabs tabs={tabs} textSize={textSize} locale={locale} selectListTab={selectListTab}
          updateTab={updateTab} updateTabs={updateTabs} updateTabPosition={updateTabPosition} getTabSize={getTabSize}
          decreaseTextSize={decreaseTextSize} increaseTextSize={increaseTextSize} hide={hideTabList}/>
      </Suspense>
    );
  }
  return (
    <div className="notepad">
      <div className="container-header main-panel-item-header">
        {tabs.length > VISIBLE_ITEM_COUNT && (
          <button className="btn icon-btn main-panel-item-header-btn" onClick={previousShift}
            aria-label={locale.mainPanel.previous_shift_title} disabled={shift <= 0}>
            <Icon id="chevron-left"/>
          </button>
        )}
        <TabsContainer current={activeIndex} offset={shift} itemCount={tabs.length}>
          <ul className="main-panel-item-header-items">
            {tabs.map((tab, i) => (
              <li className={`main-panel-item-header-item${activeIndex === i ? " active" : ""}${i < shift || i >= shift + VISIBLE_ITEM_COUNT ? " hidden" : ""}`} key={tab.id}>
                <button className="btn text-btn main-panel-item-header-item-select-btn" onClick={() => selectTab(i)}>
                  <span className="main-panel-item-header-item-title">{tab.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </TabsContainer>
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
      {storageWarning && <Warning locale={locale} storageWarning={storageWarning} dismiss={dismissWarning}/> }
      <textarea className="container-body textarea notepad-input" ref={textareaRef} style={{ "--text-size": `${activeTab.textSize || textSize}px` } as CSSProperties}
        onChange={handleTextareaChange}
        onKeyDown={handleTextareaKeyDown}
        value={activeTab.content}
        key={activeTab.id}>
      </textarea>
      {textSizeLabelVisible && <div className="container notepad-text-size-label">{activeTab.textSize}px</div>}
    </div>
  );
}
