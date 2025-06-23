import type { Site, PersistentSite, FormType } from "../top-sites.type";
import type { FormEvent } from "react";
import { useState } from "react";
import Modal from "components/Modal";
import "./form.css";


type Props = {
  form: FormType,
  locale: any,
  hiding?: boolean,
  updateSite: ((site: Site, action: "add" | "update") => string | undefined) | ((site: Partial<PersistentSite>, action: "add" | "update") => string | undefined),
  hide: () => void
}

export default function Form({ form, locale, hiding, updateSite, hide }: Props) {
  const [message, setMessage] = useState<string>("");

  function getUrl(value: string) {
    return /^https?:\/\//.test(value) ? value : `https://${value}`;
  }

  function handleFormSubmit(event: FormEvent) {
    interface FormElements extends HTMLFormControlsCollection {
      url: HTMLInputElement;
      title: HTMLInputElement;
    }

    const formElement = event.target as HTMLFormElement;
    const elements = formElement.elements as FormElements;
    const url = getUrl(elements.url.value);
    const title = elements.title.value;
    let message: string | undefined = "";

    event.preventDefault();

    if (form.updating) {
      message = updateSite({
        url,
        title: title || form.title!
      }, "update");
    }
    else {
      message = updateSite({
        url,
        title: title || url
      }, "add");
    }

    if (message) {
      setMessage(message);
    }
    else {
      hide();
    }
  }

  return (
    <Modal className="top-sites-form" transparent hiding={hiding} hide={hide}>
      <form onSubmit={handleFormSubmit}>
        <h3 className="modal-title modal-title-center">{form.updating ? locale.topSites.edit_shortcut_title : locale.topSites.add_shortcut_title}</h3>
        <div className="top-sites-form-content">
          <label className="top-sites-form-label">
            <div className="label-top">{locale.global.title_input_label}</div>
            <input type="text" className="input top-sites-form-input"
              defaultValue={form.title} placeholder="Google"
              name="title" autoComplete="off"/>
          </label>
          <label className="top-sites-form-label">
            <div className="label-top">{locale.global.url_input_label}</div>
            <input type="text" className="input top-sites-form-input"
              defaultValue={form.url} placeholder="https://google.com"
              name="url" autoComplete="off" required/>
          </label>
          {message ? <p className="top-sites-form-message">{message}</p> : null}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn text-btn" onClick={hide}>{locale.global.cancel}</button>
          <button className="btn">{form.updating ? locale.global.edit : locale.global.add}</button>
        </div>
      </form>
    </Modal>
  );
}
