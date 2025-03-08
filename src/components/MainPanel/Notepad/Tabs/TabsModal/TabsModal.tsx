import { type FormEvent } from "react";
import Modal from "components/Modal";
import "./tabs-modal.css";

type Props = {
  locale: any,
  modal: any,
  hiding?: boolean,
  confirmTabRemoval: () => void,
  createTab: (event: FormEvent) => void,
  hide: () => void
}

export default function TabsModal({ locale, modal, hiding, confirmTabRemoval, createTab, hide }: Props) {
  if (modal.type === "create") {
    return (
      <Modal className="notepad-tabs-modal" hiding={hiding} hide={hide}>
        <form onSubmit={createTab}>
          <h4 className="modal-title modal-title-center">{locale.notepad.create_modal_title}</h4>
          <input type="text" className="input" name="title"
            autoComplete="off"
            placeholder="Tab title"/>
          <div className="modal-actions">
            <button type="button" className="btn text-btn" onClick={hide}>{locale.global.cancel}</button>
            <button className="btn">{locale.global.create}</button>
          </div>
        </form>
      </Modal>
    );
  }
  else if (modal.type === "remove") {
    return (
      <Modal className="notepad-tabs-modal" hiding={hiding} hide={hide}>
        <h4 className="modal-title">{locale.notepad.remove_modal_title}</h4>
        <div className="modal-text-body">
          <p>{locale.notepad.remove_modal_text}</p>
        </div>
        <div className="modal-actions">
          <button className="btn text-btn" onClick={hide}>{locale.global.cancel}</button>
          <button className="btn" onClick={confirmTabRemoval}>{locale.global.remove}</button>
        </div>
      </Modal>
    );
  }
  return null;
}
