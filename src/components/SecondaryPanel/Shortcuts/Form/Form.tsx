import type { FormEvent } from "react";
import type { Item } from "../shortcuts.type";
import { getUrl } from "utils";
import "./form.css";


type Props = {
  locale: any,
  addItem: (item: Item) => void,
  hide: () => void
}

export default function Form({ locale, addItem, hide }: Props) {
  function handleFormSubmit(event: FormEvent) {
    interface FormElements extends HTMLFormControlsCollection {
      url: HTMLInputElement;
      title: HTMLInputElement;
    }

    const formElement = event.target as HTMLFormElement;
    const elements = formElement.elements as FormElements;
    const url = getUrl(elements.url.value);
    const title = elements.title.value;

    event.preventDefault();

    addItem({ url, title: title || url } as Item);
    hide();
  }

  return (
    <form className="shortcuts-form" onSubmit={handleFormSubmit}>
      <div className="shortcuts-form-content">
        <label>
          <div className="label-top">{locale.global.title_input_label}</div>
          <input type="text" className="input shortcuts-form-input" placeholder="Google"
            name="title" autoComplete="off"/>
        </label>
        <label>
          <div className="label-top">{locale.global.url_input_label}</div>
          <input type="text" className="input shortcuts-form-input" placeholder="https://google.com"
            name="url" autoComplete="off" required/>
        </label>
      </div>
      <div className="shortcuts-form-actions">
        <button type="button" className="btn text-btn" onClick={hide}>{locale.global.cancel}</button>
        <button className="btn">{locale.global.add}</button>
      </div>
    </form>
  );
}
