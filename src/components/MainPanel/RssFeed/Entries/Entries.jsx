import { useRef } from "react";
import TabsContainer from "components/TabsContainer";
import ToTop from "components/ToTop";
import Icon from "components/Icon";
import "./entries.css";

const VISIBLE_ITEM_COUNT = 3;

export default function Entries({ navigation, feeds, locale, selectFeed, previousShift, nextShift, showFeedList, markEntryAsRead, expandEntry }) {
  const containerRef = useRef(0);
  const { activeIndex, shift, animateLeft, animateRight } = navigation;

  function handleFeedSelection(event, index) {
    selectFeed(event.target, index, containerRef.current);
  }

  function getEntryDescription(description) {
    const div = document.createElement("div");

    div.innerHTML = description;

    for (const link of div.querySelectorAll("a")) {
      link.setAttribute("target", "_blank");
    }
    return div.innerHTML;
  }

  return (
    <div className="rss-feed">
      <div className="container-header main-panel-item-header">
        {feeds.active.length > VISIBLE_ITEM_COUNT && (
          <button className={`btn icon-btn main-panel-item-header-btn feed-shift-btn${animateLeft ? " active": ""}`}
            aria-label={locale.mainPanel.previous_shift_title} onClick={previousShift} disabled={shift <= 0}>
            <Icon id="chevron-left"/>
          </button>
        )}
        <TabsContainer current={activeIndex} offset={shift} itemCount={feeds.active.length}>
          <ul className="main-panel-item-header-items">
            {feeds.active.map((feed, i) => (
              <li className={`main-panel-item-header-item${activeIndex === i ? " active" : ""}${i < shift || i >= shift + VISIBLE_ITEM_COUNT ? " hidden" : ""}`} key={feed.url}>
                <button className={`btn icon-text-btn main-panel-item-header-item-select-btn feed-select-btn${feeds.active.length === 1 ? " one" : ""}`}
                  onClick={event => handleFeedSelection(event, i)}>
                  {feed.newEntryCount > 0 && (
                    <div className="feed-new-entry-count-container" data-entry-count>
                      <div className="feed-new-entry-count">{feed.newEntryCount}</div>
                    </div>
                  )}
                  <span className="main-panel-item-header-item-title">{feed.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </TabsContainer>
        {feeds.active.length > VISIBLE_ITEM_COUNT && (
          <button className={`btn icon-btn main-panel-item-header-btn feed-shift-btn${animateRight ? " active": ""}`}
            aria-label={locale.mainPanel.next_shift_title} onClick={nextShift} disabled={shift + VISIBLE_ITEM_COUNT >= feeds.active.length}>
            <Icon id="chevron-right"/>
          </button>
        )}
        <div className="main-panel-item-header-separator"></div>
        <button className={`btn icon-btn main-panel-item-header-btn feed-list-btn${feeds.failed.length ? " indicator" : ""}`}
          onClick={showFeedList} title={locale.rssFeed.show_feeds_title}>
          <Icon id="menu"/>
        </button>
      </div>
      <ul className="container-body feed-entries" ref={containerRef}>
        {feeds.active[activeIndex].entries.map(entry => (
          <li className="feed-entry" onClick={() => markEntryAsRead(entry)} key={entry.id}>
            <div className="feed-entry-title">
              {entry.newEntry && <span className="new-entry-indicator">{locale.rssFeed.new_entry}</span>}
              <span>
                <a href={entry.link} className="feed-entry-link" target="_blank" rel="noreferrer">{entry.title}</a>
              </span>
            </div>
            <div className={`feed-entry-description-container${entry.truncated ? " truncated" : ""}`}>
              {entry.thumbnail ? <img src={entry.thumbnail} className="feed-entry-thumbnail" height="90px" loading="lazy" alt=""/> : null}
              {entry.description ? (
                <p className="feed-entry-description" dangerouslySetInnerHTML={{ __html: getEntryDescription(entry.description) }}></p>
              ) : null}
            </div>
            <button className="btn text-btn feed-entry-expand-btn" onClick={() => expandEntry(entry)}>{locale.rssFeed.show_more}</button>
            {entry.date ? <div className="feed-date">Posted on {entry.date}</div> : null}
          </li>
        ))}
      </ul>
      <ToTop locale={locale}/>
    </div>
  );
}
