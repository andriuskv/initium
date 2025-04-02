import type { Feeds, FeedType } from "types/feed";
import { useState, type FormEvent } from "react";
import * as feedService from "services/feeds";
import Icon from "components/Icon";
import "./form.css";

type Props = {
  feeds: Feeds,
  locale: any,
  addFeed: (feed: FeedType) => void,
  hide: () => void,
}

export default function Form({ feeds, locale, addFeed, hide }: Props) {
  const [form, setForm] = useState({
    message: "",
    fetching: false,
    title: "",
    url: "",
    backButtonVisible: feeds.active.length > 0 || feeds.inactive.length > 0 || feeds.failed.length > 0
  });

  async function handleFormSubmit(event: FormEvent) {
    interface FormElements extends HTMLFormControlsCollection {
      url: HTMLInputElement;
      title: HTMLInputElement;
    }

    const formElement = event.target as HTMLFormElement;
    const elements = formElement.elements as FormElements;
    const title = elements.title.value;
    const url = elements.url.value;

    event.preventDefault();

    if (feeds.active.some(feed => feed.url === url)) {
      setForm({ ...form, message: "Feed already exists." });
      return;
    }
    setForm({ ...form, message: "", fetching: true });

    try {
      const data = await feedService.fetchFeed({ url, title });

      if ("message" in data) {
        setForm({ ...form, message: data.message });
      }
      else {
        addFeed(data);
      }
    }
    catch (e) {
      console.log(e);
      setForm({ ...form, message: (e as Error).message });
    }
  }

  return (
    <form className="feed-form" onSubmit={handleFormSubmit}>
      <Icon id="rss" className="main-panel-item-splash-icon"/>
      <h3 className="feed-form-title">{locale.rssFeed.form_title}</h3>
      <input type="text" className="input feed-form-input" name="title" placeholder={locale.global.title_input_label} autoComplete="off"/>
      <input type="text" className="input feed-form-input" name="url" placeholder={locale.global.url_input_label} required/>
      <div className="feed-add-btn-container">
        {form.message && <div className="feed-message">{form.message}</div>}
        <button className="btn" disabled={form.fetching}>{form.fetching ? "Adding..." : locale.global.add}</button>
      </div>
      {form.backButtonVisible && (
        <button type="button" className="btn icon-btn feed-form-hide-btn" onClick={hide} title={locale.global.close}>
          <Icon id="cross"/>
        </button>
      )}
    </form>
  );
}
