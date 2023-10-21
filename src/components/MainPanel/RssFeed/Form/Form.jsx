import { useState } from "react";
import * as feedService from "services/feeds";
import Icon from "components/Icon";
import "./form.css";

export default function Form({ feeds, locale, addFeed, hide }) {
  const [form, setForm] = useState({
    backButtonVisible: feeds.active.length > 0 || feeds.inactive.length > 0 || feeds.failed.length > 0
  });

  async function handleFormSubmit(event) {
    const { elements } = event.target;
    const title = elements.title.value;
    const url = elements.url.value;

    event.preventDefault();

    if (feeds.active.some(feed => feed.url === url)) {
      setForm({ ...form, message: "Feed already exists." });
      return;
    }
    delete form.message;
    setForm({ ...form, fetching: true });

    try {
      const data = await feedService.fetchFeed({ url, title });

      if (data.message) {
        setForm({ ...form, message: data.message });
      }
      else {
        addFeed(data);
      }
    }
    catch (e) {
      console.log(e);
      setForm({ ...form, message: e.message });
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
