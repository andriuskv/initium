import { useState, type ChangeEvent, type FormEvent } from "react";
import type { Item } from "../StorageTab.type";
import { parseLocaleString } from "utils";
import { getCurrentDateString } from "services/timeDate";
import * as chromeStorage from "services/chromeStorage";
import { useModal } from "hooks";
import Icon from "components/Icon";
import Modal from "components/Modal";

export default function DataManagement({ locale, items }: { locale: any, items: Item[] }) {
  const [dataMessage, setDataMessage] = useState("");
  const { modal, setModal, hiding: modalHiding, hideModal } = useModal();

  async function createDataBackup() {
    const { default: saveAs } = await import("file-saver");
    const backup: { [key: string]: any } = {};

    for (const item of items) {
      const data = await chromeStorage.get(item.name);

      if (data) {
        backup[item.name] = data;
      }
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const date = getCurrentDateString();

    saveAs(blob, `initium-new-tab-backup-${date}.json`);
  }

  function showRestoreModal() {
    setDataMessage("");
    setModal({
      type: "restore",
      title: locale.settings.storage.data_restore_title,
      body: locale.settings.storage.data_restore_message,
      confirmInputValue: ""
    });
  }

  function showWipeDataModal() {
    setModal({
      type: "wipe-data",
      title: locale.settings.storage.data_wipe_title,
      body: locale.settings.storage.data_wipe_message,
      confirmInputValue: ""
    });
  }

  async function restoreFromBackup(event: FormEvent) {
    event.preventDefault();

    try {
      if (modal?.confirmInputValue !== "restore") {
        return;
      }
      const [fileHandle] = await (window as any).showOpenFilePicker({
        types: [{
          accept: {
            "application/json": [".json"]
          }
        }]
      });
      setModal(null);

      const file = await fileHandle.getFile();

      if (file.type !== "application/json") {
        setDataMessage(locale.settings.storage.invalid_file);
        return;
      }

      try {
        const json = JSON.parse(await file.text());

        for (const key of Object.keys(json)) {
          const isKeyPresent = items.some(item => item.name === key);

          if (isKeyPresent) {
            chromeStorage.set({ [key]: json[key] }, { updateLocally: true });
          }
        }
      } catch {
        setDataMessage(locale.settings.storage.invalid_json);
      }
    } catch (e) {
      console.log(e);
    }
  }

  function wipeAllData(event: FormEvent) {
    event.preventDefault();

    if (modal?.confirmInputValue !== "wipe all data") {
      return;
    }
    for (const item of items) {
      chromeStorage.remove(item.name);
    }
    setModal(null);
  }

  function handleImportInputChange(event: ChangeEvent) {
    setModal({ ...modal, confirmInputValue: (event.target as HTMLInputElement).value });
  }

  const restoreConfirmMessage = parseLocaleString(locale.settings.storage.data_confirm, <b key="1">restore</b>);
  const wipeConfirmMessage = parseLocaleString(locale.settings.storage.data_confirm, <b key="1">wipe all data</b>);

  return (
    <>
      <div className="storage-data">
        <h4 className="storage-data-title">{locale.settings.storage.data_title}</h4>
        {dataMessage ? <p className="storage-data-message">{dataMessage}</p> : null}
        <div className="storage-data-btns">
          <button className="btn icon-text-btn alt-icon-text-btn" onClick={createDataBackup}>
            <Icon id="download"/>
            <span>{locale.settings.storage.data_backup}</span>
          </button>
          <button className="btn icon-text-btn alt-icon-text-btn" onClick={showRestoreModal}>
            <Icon id="upload"/>
            <span>{locale.settings.storage.data_restore}</span>
          </button>
          <button className="btn icon-text-btn alt-icon-text-btn" onClick={showWipeDataModal}>
            <Icon id="trash"/>
            <span>{locale.settings.storage.data_wipe}</span>
          </button>
        </div>
      </div>
      {modal?.type === "restore" ? (
        <Modal hiding={modalHiding} hide={hideModal} className="storage-modal">
          <form onSubmit={restoreFromBackup}>
            <h4 className="modal-title">{modal.title}</h4>
            <div className="modal-text-body">{modal.body}</div>
            <div className="storage-confirm-input-container">
              <label>
                <div>{restoreConfirmMessage}</div>
                <input type="text" className="input" autoComplete="off"
                  onChange={handleImportInputChange} value={modal.confirmInputValue} required/>
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn text-btn" onClick={hideModal}>{locale.global.cancel}</button>
              <button className="btn" disabled={modal.confirmInputValue !== "restore"}>{locale.global.restore}</button>
            </div>
          </form>
        </Modal>
      ) : modal?.type === "wipe-data" ? (
        <Modal hiding={modalHiding} hide={hideModal} className="storage-modal">
          <form onSubmit={wipeAllData}>
            <h4 className="modal-title">{modal.title}</h4>
            <div className="modal-text-body">{modal.body}</div>
            <div className="storage-confirm-input-container">
              <label>
                <div>{wipeConfirmMessage}</div>
                <input type="text" className="input" autoComplete="off"
                  onChange={handleImportInputChange} value={modal.confirmInputValue} required/>
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn text-btn" onClick={hideModal}>{locale.global.cancel}</button>
              <button className="btn" disabled={modal.confirmInputValue !== "wipe all data"}>{locale.global.confirm}</button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
