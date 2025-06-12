import type { Placement, PlacementItem } from "types/settings";
import { usePlacement } from "contexts/placement";
import Dropdown from "components/Dropdown";
import Modal from "components/Modal";
import "./placement.css";

export default function Placement({ locale, hiding, hide }: { locale: any, hiding: boolean, hide: () => void }) {
  const { placement, swapPosition, resetPositions } = usePlacement();
  const arr = Object.entries(placement) as [keyof Placement, PlacementItem][];

  return (
    <Modal hiding={hiding} hide={hide}>
      <h3 className="modal-title modal-title-center">{locale.settings.general.corners}</h3>
      <div className="settings-placement-items">
        {arr.map(([key, value]) => (
          <Dropdown toggle={{ title: locale.settings.general[value.id || "empty"], isTextBtn: true }} container={{ className: "settings-placement-item" }} key={key}>
            {arr.map(([key2, value2]) => key === key2 ? null : (
              <button className="btn text-btn dropdown-btn" onClick={() => swapPosition(key, key2)} key={key2}>{locale.settings.general[value2.id]}</button>
            ))}
          </Dropdown>
        ))}
      </div>
      <div className="modal-actions">
        <button className="btn text-btn text-negative-btn middle-top-order-reset-btn" onClick={resetPositions}>{locale.global.reset}</button>
        <button className="btn text-btn" onClick={hide}>{locale.global.done}</button>
      </div>
    </Modal>
  );
}
