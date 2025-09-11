import type { ReactNode, CSSProperties, PointerEvent } from "react";
import type { Item } from "./SecondaryPanel.type";
import Icon from "components/Icon";

type Props = {
  children: ReactNode;
  item: Item;
  className?: string;
  style?: CSSProperties;
  locale: any;
  handleMoveInit: (e: PointerEvent<HTMLDivElement>) => void;
  hide: () => void;
}

export default function Container({ children, item, className = "", style, locale, handleMoveInit, hide }: Props) {
  return (
    <div className={`container secondary-panel-item-container corner-item${item.visible ? " visible" : ""}${className}`}
      data-move-target={item.moved ? "" : item.id}>
      <div className="container-header secondary-panel-item-header secondary-panel-transition-target"
        data-move-id={item.id} onPointerDown={handleMoveInit}>
        <Icon id={item.iconId}/>
        <h3 className="secondary-panel-item-title">{item.title}</h3>
        <button className="btn icon-btn" onClick={hide} data-comp-focus-id={item.id} title={locale.global.close}>
          <Icon id="cross"/>
        </button>
      </div>
      <div className="secondary-panel-transition-target">
        <div className={`container-body secondary-panel-item-content`} style={style}>
          {children}
        </div>
      </div>
    </div>
  );
}
