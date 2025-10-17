import Dropdown from "components/Dropdown";
import Icon from "components/Icon";
import "./Header.css";

type Props = {
  locale: any,
  bytes: { usedFormated: string, maxFormated: string, message?: string } | null
  hide: () => void
}

export default function Header({ locale, bytes, hide }: Props) {
  return (
    <div className="container-header">
      <Dropdown
        toggle={{ title: locale.global.info, iconId: "info" }}
        body={{ className: "greeting-editor-dropdown" }}>
        <ul className="greeting-editor-info-items">
          <li>{locale.greetingEditor.info_1}</li>
          <li>{locale.greetingEditor.info_2}</li>
          <li>{locale.greetingEditor.info_3}</li>
        </ul>
      </Dropdown>
      {bytes && (
        <span className="greeting-editor-space-usage">{bytes.usedFormated} / {bytes.maxFormated}</span>
      )}
      <h3 className="container-header-title">{locale.greetingEditor.title}</h3>
      <button className="btn icon-btn" onClick={hide} title={locale.global.close}>
        <Icon id="cross"/>
      </button>
    </div>
  );
}
