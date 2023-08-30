import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import Modal from "components/Modal";
import * as settingsService from "services/settings";
import "./middle-top.css";

export default function MiddleTop({ settings, updateSetting, hide }) {
  const items = settings.general.middleTopOrder;

  function changeOrder(order, id) {
    const index = items.findIndex(item => item.id === id);

    if (order === -1 && index <= 0 || order === 1 && index >= items.length - 1) {
      return;
    }
    ([items[index], items[index + order]] = [items[index + order], items[index]]);

    updateSetting("general", {
      middleTopOrder: [...items]
    });
  }

  function changeAlignment(alignment, id) {
    const item = items.find(item => item.id === id);

    item.alignment = alignment;

    updateSetting("general", {
      middleTopOrder: [...items]
    });
  }

  function reset() {
    const { general: { middleTopOrder } } = settingsService.getDefault();

    updateSetting("general", { middleTopOrder });
  }

  return (
    <Modal hide={hide}>
      <h3 className="modal-title modal-title-center">Middle top order</h3>
      <ul className="middle-top-order-items">
        {items.map((item, index) => (
          <li className="middle-top-order-item" key={item.id}>
            <div className="category-modal-list-item-order-btn-container">
              <button className="btn icon-btn middle-top-order-btn" onClick={() => changeOrder(-1, item.id)}
                disabled={index === 0} title="Move up">
                <Icon id="chevron-up"/>
              </button>
              <button className="btn icon-btn middle-top-order-btn" onClick={() => changeOrder(1, item.id)}
                disabled={index === items.length - 1} title="Move down">
                <Icon id="chevron-down"/>
              </button>
            </div>
            <div className="middle-top-order-item-name">{item.name}</div>
            <Dropdown toggle={{ title: "Alignment" }}>
              <button className={`btn text-btn dropdown-btn${item.alignment === "top" ? " active" : ""}`}
                onClick={() => changeAlignment("start", item.id)}>Top</button>
              <button className={`btn text-btn dropdown-btn${!item.alignment || item.alignment === "center" ? " active" : ""}`}
                onClick={() => changeAlignment("center", item.id)}>Center</button>
              <button className={`btn text-btn dropdown-btn${item.alignment === "bottom" ? " active" : ""}`}
                onClick={() => changeAlignment("end", item.id)}>Bottom</button>
            </Dropdown>
          </li>
        ))}
      </ul>
      <div className="modal-actions">
        <button className="btn text-btn text-negative-btn middle-top-order-reset-btn" onClick={reset}>Reset</button>
        <button className="btn text-btn" onClick={hide}>Done</button>
      </div>
    </Modal>
  );
}
