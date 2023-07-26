import { useState } from "react";
import { SortableItem, SortableList } from "components/Sortable";
import "./middle-top.css";

export default function MiddleTop({ settings, updateSetting }) {
  const [items, setItems] = useState(settings.general.middleTopItemOrder);
  const [activeDragId, setActiveDragId] = useState(null);

  function handleSort(items) {
    if (items) {
      setItems(items);
      updateSetting("general", {
        middleTopItemOrder: items
      });
    }
    setActiveDragId(null);
  }

  function handleDragStart(event) {
    setActiveDragId(event.active.id);
  }

  return (
    <div className="settings-group">
      <h4 className="settings-group-title">Middle top</h4>
      <div className="setting">
        <div>
          <div className="settings-middle-top-order-title">Order</div>
          <ul className="settings-middle-top-order-items">
            <SortableList
              items={items}
              handleSort={handleSort}
              handleDragStart={handleDragStart}>
              {items.map(item => (
                <SortableItem className={`settings-middle-top-order-item${item.id === activeDragId ? " dragging" : ""}`}
                  id={item.id} key={item.id}>
                  {item.name}
                </SortableItem>
              ))}
            </SortableList>
          </ul>
        </div>
      </div>
    </div>
  );
}
