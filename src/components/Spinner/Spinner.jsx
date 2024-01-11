import Icon from "components/Icon";

export default function Spinner({ className, size }) {
  return <Icon id="spinner" className={className} size={size} style={{ color: "var(--color-primary)" }}/>;
}
