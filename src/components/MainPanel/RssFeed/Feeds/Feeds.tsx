import type { DragStartEvent } from "@dnd-kit/core";
import type { FailedFeedType, Feeds, FeedType, FeedTypeName } from "types/feed";
import { useState, type CSSProperties, type MouseEvent } from "react";
import * as feedService from "services/feeds";
import { SortableItem, SortableList } from "components/Sortable";
import Dropdown from "components/Dropdown";
import Icon from "components/Icon";
import Spinner from "components/Spinner";
import Link from "components/Link";
import CreateButton from "components/CreateButton";
import "./feeds.css";
import Feed from "./Feed";

type Props = {
  locale: any,
  feeds: Feeds,
  selectFeedFromList: (event: MouseEvent<HTMLButtonElement>, index: number) => void,
  removeFeed: (index: number, type: FeedTypeName) => void,
  deactivateFeed: (index: number, type: FeedTypeName) => void,
  updateFeeds: (feeds: Feeds, shouldSave?: boolean) => void,
  updateFeed: (feed: FeedType, type: FeedTypeName, shouldSave?: boolean) => void,
  dismissMessage: (feed: FeedType, type: FeedTypeName) => void,
  showForm: () => void,
  hide: () => void,
}

export default function Feeds({ feeds, locale, selectFeedFromList, removeFeed, deactivateFeed, updateFeeds, updateFeed, dismissMessage, showForm, hide }: Props) {
  const [activeDragId, setActiveDragId] = useState("");

  async function refetchFeed(feed: FeedType, type: FeedTypeName) {
    updateFeed({
      ...feed,
      fetching: true,
      message: undefined
    }, type, false);

    try {
      const data = await feedService.fetchFeed(feed);

      if ("message" in data) {
        updateFeed({
          ...feed,
          fetching: undefined,
          message: locale.rssFeed.fetch_error,
        }, type, false);
        return;
      }

      if (type === "failed") {
        insertFailedFeed(data, (feed as FailedFeedType).index);
      }
      else if (type === "inactive") {
        activateFeed(data);
      }
    } catch (e) {
      console.log(e);

      updateFeed({
        ...feed,
        fetching: undefined
      }, type, false);
    }
  }

  function insertFailedFeed(feed: FeedType, index: number) {
    updateFeeds({
      ...feeds,
      failed: feeds.failed.filter(({ url }) => url !== feed.url),
      active: feeds.active.toSpliced(index, 0, feed)
    });
  }

  function activateFeed(feed: FeedType) {
    updateFeeds({
      ...feeds,
      inactive: feeds.inactive.filter(({ url }) => url !== feed.url),
      active: [...feeds.active, feed]
    });
  }

  function handleSort(items: unknown[] | null) {
    if (items) {
      updateFeeds({
        ...feeds,
        active: items as Feeds["active"]
      });
    }
    setActiveDragId("");
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
  }

  function renderFeed(feed: FeedType, index: number) {
    const component = {
      Component: Feed,
      params: {
        index,
        feed,
        locale,
        updateFeed,
        selectFeedFromList,
        deactivateFeed,
        removeFeed
      }
    };

    return (
      <SortableItem className={`feed-list-item${feed.id === activeDragId ? " dragging" : ""}`}
        component={component} id={feed.id} key={feed.id} handleTitle={locale.global.drag}/>
    );
  }

  return (
    <div className="rss-feed">
      <div className="container-header feed-list-header">
        <h2 className="container-header-title">{locale.rssFeed.feeds_title}</h2>
        {feeds.active.length > 0 && (
          <button className="btn icon-btn" onClick={hide} title={locale.global.close}>
            <Icon id="cross"/>
          </button>
        )}
      </div>
      <ul className="container-body feed-list-items" data-dropdown-parent>
        <SortableList
          items={feeds.active}
          handleSort={handleSort}
          handleDragStart={handleDragStart}>
          {feeds.active.map((feed, index) => renderFeed(feed, index))}
        </SortableList>
        {feeds.failed.map((feed, index) => (
          <li className={`feed-list-item${feed.fetching ? " fetching" : ""}`} key={feed.url}>
            <div className="feed-list-item-content">
              <div className="feed-list-item-header">
                <div className="feed-list-item-title-container">
                  <h3 className="feed-list-item-title">{feed.title}</h3>
                  <Link href={feed.url} className="feed-list-item-url">{feed.url}</Link>
                </div>
                <Dropdown>
                  <button className="btn icon-text-btn dropdown-btn" onClick={() => deactivateFeed(index, "failed")}>
                    <Icon id="sleep"/>
                    <span>{locale.rssFeed.deactive}</span>
                  </button>
                  <button className="btn icon-text-btn dropdown-btn" onClick={() => removeFeed(index, "failed")}>
                    <Icon id="trash"/>
                    <span>{locale.global.remove}</span>
                  </button>
                </Dropdown>
              </div>
              <div className="feed-list-item-error">
                <span>{locale.rssFeed.fetch_error}</span>
                <button className="btn" onClick={() => refetchFeed(feed, "failed")} disabled={feed.fetching}>{locale.rssFeed.retry}</button>
              </div>
            </div>
            {feed.fetching ? (
              <div className="feed-list-item-mask">
                <Spinner size="32px"/>
              </div>
            ) : null}
          </li>
        ))}
        {feeds.inactive.map((feed, index) => (
          <li className={`feed-list-item${feed.fetching ? " fetching" : ""}`} key={feed.url}>
            <div className="feed-list-item-content">
              <div className="feed-list-item-header">
                {feed.image ? <img src={feed.image} className="feed-list-item-logo" width="40px" height="40px" alt=""/> : null}
                <div className="feed-list-item-title-container">
                  <h3 className="feed-list-item-title inactive">
                    <Icon id="sleep" className="inactive-feed-icon" title={locale.rssFeed.inactive}/>
                    <span>{feed.title}</span>
                  </h3>
                  <Link href={feed.url} className="feed-list-item-url">{feed.url}</Link>
                </div>
                <Dropdown disabled={feed.fetching}>
                  <button className="btn icon-text-btn dropdown-btn" onClick={() => refetchFeed(feed, "inactive")}>
                    <Icon id="sleep-off"/>
                    <span>{locale.rssFeed.activate}</span>
                  </button>
                  <button className="btn icon-text-btn dropdown-btn" onClick={() => removeFeed(index, "inactive")}>
                    <Icon id="trash"/>
                    <span>{locale.global.remove}</span>
                  </button>
                </Dropdown>
              </div>
              <p>{feed.description}</p>
              {feed.message ? (
                <div className="feed-list-item-error">
                  <span>{feed.message}</span>
                  <button className="btn icon-btn" onClick={() => dismissMessage(feed, "inactive")}><Icon id="cross" title={locale.global.dismiss}/></button>
                </div>
              ) : null}
            </div>
            {feed.fetching ? (
              <div className="feed-list-item-mask">
                <Spinner size="32px"/>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <CreateButton style={{ "--expanded-width": "76px" } as CSSProperties} onClick={showForm}>{locale.global.add}</CreateButton>
    </div>
  );
}
