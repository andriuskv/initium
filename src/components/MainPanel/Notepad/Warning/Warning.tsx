import Dropdown from "components/Dropdown";
import Toast from "components/Toast";
import "./warning.css";

type Props = {
  locale: any,
  storageWarning: {
    usedRatio: number,
    message: string,
    hidden?: boolean
  },
  dismiss: () => void
}

export default function Warning({ locale, storageWarning, dismiss }: Props) {
  if (storageWarning.hidden) {
    return null;
  }
  else if (storageWarning.usedRatio >= 1) {
    return <Toast message={storageWarning.message} position="bottom" locale={locale} dismiss={dismiss}/>;
  }
  return (
    <Dropdown
      container={{ className: "notepad-warning-dropdown-container" }}
      toggle={{ title: "Show warning", iconId: "warning" }}
      body={{ className: "notepad-warning-dropdown" }}>
      <p>{storageWarning.message}</p>
    </Dropdown>
  );
}
