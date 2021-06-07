import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { getRandomString } from "utils";
import * as chromeStorage from "services/chromeStorage";
import Icon from "components/Icon";
import "./notepad.css";

const Tabs = lazy(() => import("./Tabs"));

export default function Notepad() {
  const [tabs, setTabs] = useState(null);
  const [{ activeIndex, shift }, setNavigation] = useState(() => ({ activeIndex: 0, shift: 0 }));
  const [tabListVisible, setTabListVisible] = useState(false);
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
        return tab;
      });
    }
    else {
      notepad = [{
        id: getRandomString(),
        title: "Tab",
        content: ""
      }];
    }
    setTabs(notepad);

    chromeStorage.subscribeToChanges(({ notepad }) => {
      if (notepad) {
        setTabs(notepad.newValue);
      }
    });
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

  function handleTextareaChange(event) {
    tabs[activeIndex].content = event.target.value;
    clearTimeout(saveTimeoutId.current);
    saveTimeoutId.current = setTimeout(() => {
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
    const { default: cloneDeep } = await import("lodash.clonedeep");

    chromeStorage.set({ notepad: cloneDeep(tabs).map(tab => {
      delete tab.id;
      return tab;
    }) });
  }

  if (!tabs) {
    return null;
  }
  else if (tabListVisible) {
    return (
      <Suspense fallback={null}>
        <Tabs tabs={tabs} selectListTab={selectListTab} updateTabs={updateTabs} updateTabPosition={updateTabPosition} hide={hideTabList}/>
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
              <button className="btn text-btn main-panel-item-header-item-select-btn"
                onClick={() => selectTab(i)} disabled={tabs.length === 1}>
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
      <textarea className="notepad-input" ref={textareaRef}
        onChange={handleTextareaChange}
        defaultValue={tabs[activeIndex].content}
        key={tabs[activeIndex].id}>
      </textarea>
    </div>
  );
}
